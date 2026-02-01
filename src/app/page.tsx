"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Task, Step, SubStep } from "@/lib/types";
import { generateMicroWinSteps } from "@/ai/flows/generate-micro-win-steps";
import { breakDownFurther } from "@/ai/flows/break-down-further";
import { useUser, useFirestore, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { collection, doc, onSnapshot, setDoc, deleteDoc } from "firebase/firestore";


import { AppHeader } from "@/components/app-header";
import { TaskInput } from "@/components/task-input";
import { TaskDisplay } from "@/components/task-display";
import { PageSkeleton } from "@/components/page-skeleton";
import { cn } from "@/lib/utils";

const TASK_DOC_ID = "current_task";

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [isTaskLoading, setIsTaskLoading] = useState(true);

  const [isGenerating, startGeneratingTransition] = useTransition();
  const [isBreakingDown, startBreakingDownTransition] = useTransition();
  const [breakingDownId, setBreakingDownId] = useState<string | null>(null);
  const { toast } = useToast();

  const taskDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, "users", user.uid, "tasks", TASK_DOC_ID) : null),
    [firestore, user]
  );
  
  const historyCollectionRef = useMemoFirebase(
    () => (firestore && user ? collection(firestore, "users", user.uid, "history") : null),
    [firestore, user]
  );

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  // App Hydration: On initial mount, subscribe to Firestore data.
  useEffect(() => {
    if (!taskDocRef) {
       setIsTaskLoading(isUserLoading); // Only loading if user is loading
      return;
    }
    setIsTaskLoading(true);
    const unsubscribe = onSnapshot(taskDocRef, (doc) => {
      if (doc.exists()) {
        const taskData = doc.data() as Task;
        // Basic validation in case of empty/corrupt data
        if (taskData.mainTask && taskData.steps) {
            setCurrentTask(taskData);
        } else {
            setCurrentTask(null);
        }
      } else {
        setCurrentTask(null);
      }
      setIsTaskLoading(false);
    }, (error) => {
      console.error("Failed to load data from Firestore:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load your saved task.",
      });
      setIsTaskLoading(false);
    });

    return () => unsubscribe();
  }, [taskDocRef, toast, isUserLoading]);

  // State Synchronization to Firestore
  useEffect(() => {
    if (!isTaskLoading && taskDocRef && currentTask) {
      setDoc(taskDocRef, currentTask, { merge: true }).catch((error) => {
        console.error("Failed to save task to Firestore:", error);
        toast({
          variant: "destructive",
          title: "Error saving task",
          description: "Your task could not be saved.",
        });
      });
    }
  }, [currentTask, taskDocRef, isTaskLoading, toast]);


  const handleCreateTask = async (data: { task: string }) => {
    if (!taskDocRef) return;

    startGeneratingTransition(async () => {
      try {
        const result = await generateMicroWinSteps({ task: data.task });
        if (!result || !result.steps || result.steps.length === 0) {
          throw new Error("AI failed to generate steps.");
        }
        const newTask: Task = {
          id: TASK_DOC_ID,
          mainTask: data.task,
          steps: result.steps.map((stepText) => ({
            id: crypto.randomUUID(),
            text: stepText,
            completed: false,
            subSteps: [],
          })),
          createdAt: Date.now(),
        };
        setCurrentTask(newTask);
      } catch (error) {
        console.error("Failed to generate steps:", error);
        toast({
          variant: "destructive",
          title: "Generation Failed",
          description:
            "The AI could not generate steps for this task. Please try a different one.",
        });
      }
    });
  };

  const handleToggleStep = (stepId: string) => {
    if (!currentTask) return;
    const isCompleting = !currentTask.steps.find(s => s.id === stepId)?.completed;
    const updatedSteps = currentTask.steps.map((step) =>
      step.id === stepId 
        ? { ...step, completed: isCompleting, subSteps: step.subSteps.map(sub => ({...sub, completed: isCompleting})) } 
        : step
    );
    setCurrentTask({ ...currentTask, steps: updatedSteps });
  };

  const handleToggleSubStep = (stepId: string, subStepId: string) => {
    if (!currentTask) return;
    let parentStepCompleted = true;
    const updatedSteps = currentTask.steps.map((step) => {
      if (step.id === stepId) {
        const updatedSubSteps = step.subSteps.map((subStep) =>
          subStep.id === subStepId
            ? { ...subStep, completed: !subStep.completed }
            : subStep
        );
        
        parentStepCompleted = updatedSubSteps.every(s => s.completed);

        return { ...step, subSteps: updatedSubSteps, completed: parentStepCompleted };
      }
      return step;
    });
    setCurrentTask({ ...currentTask, steps: updatedSteps });
  };

  const handleBreakDown = (step: Step) => {
    if (!currentTask) return;
    setBreakingDownId(step.id);
    startBreakingDownTransition(async () => {
      try {
        const result = await breakDownFurther({ task: step.text });
        if (!result || !result.subSteps || result.subSteps.length === 0) {
          throw new Error("AI failed to generate sub-steps.");
        }

        const newSubSteps: SubStep[] = result.subSteps.map((text) => ({
          id: crypto.randomUUID(),
          text,
          completed: false,
        }));

        const updatedSteps = currentTask.steps.map((s) =>
          s.id === step.id
            // If sub-steps already exist, add to them. Otherwise, create them.
            ? { ...s, subSteps: [...(s.subSteps || []), ...newSubSteps], completed: false }
            : s
        );

        setCurrentTask({ ...currentTask, steps: updatedSteps });
      } catch (error) {
        console.error("Failed to break down step:", error);
        toast({
          variant: "destructive",
          title: "Breakdown Failed",
          description:
            "The AI could not break this step down further. Please try again.",
        });
      } finally {
        setBreakingDownId(null);
      }
    });
  };

  const handleReset = async () => {
    if (!currentTask || !taskDocRef || !historyCollectionRef) {
        setCurrentTask(null);
        if(taskDocRef) await deleteDoc(taskDocRef);
        return;
    };
    
    // 1. Archive the current task to history
    const historyDoc = doc(historyCollectionRef, String(currentTask.createdAt));
    await setDoc(historyDoc, currentTask);

    // 2. Clear the current task
    await deleteDoc(taskDocRef);
    setCurrentTask(null);

    toast({
      title: "Task archived.",
      description: "Ready for the next challenge!",
    });
  };

  if (isUserLoading || isTaskLoading) {
    return <PageSkeleton />;
  }

  return (
    <main
      className={cn(
        "flex flex-col items-center justify-start min-h-screen bg-background text-foreground p-4 pt-12 md:pt-20 transition-colors"
      )}
    >
      <AppHeader />
      <div className="w-full max-w-2xl mt-8">
        {!currentTask ? (
          <TaskInput onSubmit={handleCreateTask} isPending={isGenerating} />
        ) : (
          <TaskDisplay
            task={currentTask}
            onToggleStep={handleToggleStep}
            onToggleSubStep={handleToggleSubStep}
            onBreakdown={handleBreakDown}
            onReset={handleReset}
            breakingDownId={isBreakingDown ? breakingDownId : null}
          />
        )}
      </div>
    </main>
  );
}

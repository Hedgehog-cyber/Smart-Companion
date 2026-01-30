"use client";

import { useEffect, useState, useTransition, useRef, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Task, Step, SubStep } from "@/lib/types";
import { generateMicroWinSteps } from "@/ai/flows/generate-micro-win-steps";
import { breakDownFurther } from "@/ai/flows/break-down-further";
import { useUser, useFirestore, useDoc, useMemoFirebase, getTaskRef, saveTask, deleteTask } from "@/firebase";
import { useRouter } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { TaskInput } from "@/components/task-input";
import { TaskDisplay } from "@/components/task-display";
import { PageSkeleton } from "@/components/page-skeleton";
import { DopamineCounter } from "@/components/dopamine-counter";
import { cn } from "@/lib/utils";
import { Sparkles } from "@/components/sparkles";

export default function Home() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const [completedWins, setCompletedWins] = useState(0);

  const [isGenerating, startGeneratingTransition] = useTransition();
  const [isBreakingDown, startBreakingDownTransition] = useTransition();
  const [breakingDownId, setBreakingDownId] = useState<string | null>(null);
  const { toast } = useToast();

  const [isAnimating, setIsAnimating] = useState(false);
  const prevWinsRef = useRef(completedWins);

  const taskRef = useMemoFirebase(() => {
    if (!user) return null;
    return getTaskRef(firestore, user.uid);
  }, [firestore, user]);

  const { data: task, isLoading: isTaskLoading, error: taskError } = useDoc<Task>(taskRef);

  useEffect(() => {
    if (taskError) {
      console.error("Error loading task:", taskError);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load your task.",
      });
    }
  }, [taskError, toast]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (task) {
      const initialWins = task.steps.reduce((acc, step) => {
        if (step.completed) acc++;
        acc += step.subSteps.filter((sub) => sub.completed).length;
        return acc;
      }, 0);
      setCompletedWins(initialWins);
    } else {
      setCompletedWins(0);
    }
  }, [task]);


  useEffect(() => {
    if (completedWins > prevWinsRef.current) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 2000); // match max animation duration
      return () => clearTimeout(timer);
    }
    prevWinsRef.current = completedWins;
  }, [completedWins]);
  
  useEffect(() => {
    if (!isTaskLoading) {
      prevWinsRef.current = completedWins;
    }
  }, [isTaskLoading, completedWins]);


  const updateTaskAndSave = (updatedTask: Task | null) => {
    if (!taskRef) return;
    try {
      if (updatedTask) {
        saveTask(taskRef, updatedTask);
      } else {
        deleteTask(taskRef);
      }
    } catch (error) {
      console.error("Failed to save task to Firestore:", error);
      toast({
        variant: "destructive",
        title: "Error saving task",
        description: "Your task could not be saved.",
      });
    }
  };

  const handleCreateTask = async (data: { task: string }) => {
    startGeneratingTransition(async () => {
      try {
        const result = await generateMicroWinSteps({ task: data.task });
        if (!result || !result.steps || result.steps.length === 0) {
          throw new Error("AI failed to generate steps.");
        }
        const newTask: Task = {
          id: "current_task",
          mainTask: data.task,
          steps: result.steps.map((stepText) => ({
            id: crypto.randomUUID(),
            text: stepText,
            completed: false,
            subSteps: [],
          })),
          createdAt: Date.now(),
        };
        updateTaskAndSave(newTask);
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
    if (!task) return;
    const updatedSteps = task.steps.map((step) =>
      step.id === stepId ? { ...step, completed: !step.completed } : step
    );
    updateTaskAndSave({ ...task, steps: updatedSteps });
  };

  const handleToggleSubStep = (stepId: string, subStepId: string) => {
    if (!task) return;
    const updatedSteps = task.steps.map((step) => {
      if (step.id === stepId) {
        const updatedSubSteps = step.subSteps.map((subStep) =>
          subStep.id === subStepId
            ? { ...subStep, completed: !subStep.completed }
            : subStep
        );
        return { ...step, subSteps: updatedSubSteps };
      }
      return step;
    });
    updateTaskAndSave({ ...task, steps: updatedSteps });
  };

  const handleBreakDown = (step: Step) => {
    if (!task) return;
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

        const updatedSteps = task.steps.map((s) =>
          s.id === step.id
            ? { ...s, subSteps: [...s.subSteps, ...newSubSteps] }
            : s
        );

        updateTaskAndSave({ ...task, steps: updatedSteps });
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

  const handleClearCompleted = () => {
    if (!task) return;
    const activeSteps = task.steps
      .map((step) => ({
        ...step,
        subSteps: step.subSteps.filter((sub) => !sub.completed),
      }))
      .filter((step) => !step.completed);

    updateTaskAndSave({ ...task, steps: activeSteps });
    toast({ title: "Completed steps cleared!" });
  };

  const handleReset = async () => {
    updateTaskAndSave(null);
    toast({
      title: "Task reset.",
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
      {isAnimating && <Sparkles />}
      <AppHeader />
      <DopamineCounter count={completedWins} />
      <div className="w-full max-w-2xl">
        {!task ? (
          <TaskInput onSubmit={handleCreateTask} isPending={isGenerating} />
        ) : (
          <TaskDisplay
            task={task}
            onToggleStep={handleToggleStep}
            onToggleSubStep={handleToggleSubStep}
            onBreakdown={handleBreakDown}
            onClearCompleted={handleClearCompleted}
            onReset={handleReset}
            breakingDownId={isBreakingDown ? breakingDownId : null}
          />
        )}
      </div>
    </main>
  );
}

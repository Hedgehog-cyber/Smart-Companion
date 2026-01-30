"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Task, Step, SubStep } from "@/lib/types";
import { generateMicroWinSteps } from "@/ai/flows/generate-micro-win-steps";
import { breakDownFurther } from "@/ai/flows/break-down-further";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { TaskInput } from "@/components/task-input";
import { TaskDisplay } from "@/components/task-display";
import { PageSkeleton } from "@/components/page-skeleton";
import { DopamineCounter } from "@/components/dopamine-counter";
import { cn } from "@/lib/utils";
import { Sparkles } from "@/components/sparkles";

// Privacy Shield: All user task data is stored locally in the browser's
// localStorage to comply with our Privacy-First hackathon requirement.
// No data is sent to a server.
const LOCAL_STORAGE_KEY = "smart_companion_tasks";

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [taskHistory, setTaskHistory] = useState<Task[]>([]);
  const [completedWins, setCompletedWins] = useState(0);
  const [isTaskLoading, setIsTaskLoading] = useState(true);

  const [isGenerating, startGeneratingTransition] = useTransition();
  const [isBreakingDown, startBreakingDownTransition] = useTransition();
  const [breakingDownId, setBreakingDownId] = useState<string | null>(null);
  const { toast } = useToast();

  const [isAnimating, setIsAnimating] = useState(false);
  const prevWinsRef = useRef(completedWins);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  // App Hydration: On initial mount, check for existing data in localStorage.
  useEffect(() => {
    setIsTaskLoading(true);
    try {
      const savedDataJson = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedDataJson) {
        const { currentTask: savedTask, history: savedHistory } = JSON.parse(savedDataJson);
        if (savedTask) {
          setCurrentTask(savedTask);
        }
        if (savedHistory) {
          setTaskHistory(savedHistory);
        }
      }
    } catch (error) {
      console.error("Failed to load data from localStorage:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load your saved task.",
      });
    } finally {
      setIsTaskLoading(false);
    }
  }, [toast]);

  // State Synchronization & Deep Persistence:
  // This effect saves the state to localStorage whenever it changes.
  useEffect(() => {
    if (!isTaskLoading) {
      try {
        const dataToSave = { currentTask, history: taskHistory };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
      } catch (error) {
        console.error("Failed to save task to localStorage:", error);
        toast({
          variant: "destructive",
          title: "Error saving task",
          description: "Your task could not be saved to local storage.",
        });
      }
    }
  }, [currentTask, taskHistory, isTaskLoading, toast]);
  
  // Update dopamine counter when task changes
  useEffect(() => {
    if (currentTask) {
      const totalWins = currentTask.steps.reduce((acc, step) => {
        if (step.completed) acc++;
        acc += step.subSteps.filter((sub) => sub.completed).length;
        return acc;
      }, 0);
      setCompletedWins(totalWins);
    } else {
      setCompletedWins(0);
    }
  }, [currentTask]);


  useEffect(() => {
    if (completedWins > prevWinsRef.current) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 2000); // match max animation duration
      return () => clearTimeout(timer);
    }
    prevWinsRef.current = completedWins;
  }, [completedWins]);

  const handleCreateTask = async (data: { task: string }) => {
    startGeneratingTransition(async () => {
      try {
        const result = await generateMicroWinSteps({ task: data.task });
        if (!result || !result.steps || result.steps.length === 0) {
          throw new Error("AI failed to generate steps.");
        }
        const newTask: Task = {
          id: crypto.randomUUID(),
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
    const updatedSteps = currentTask.steps.map((step) =>
      step.id === stepId ? { ...step, completed: !step.completed } : step
    );
    setCurrentTask({ ...currentTask, steps: updatedSteps });
  };

  const handleToggleSubStep = (stepId: string, subStepId: string) => {
    if (!currentTask) return;
    const updatedSteps = currentTask.steps.map((step) => {
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
            ? { ...s, subSteps: [...s.subSteps, ...newSubSteps] }
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

  const handleClearCompleted = () => {
    if (!currentTask) return;
    const activeSteps = currentTask.steps
      .map((step) => ({
        ...step,
        subSteps: step.subSteps.filter((sub) => !sub.completed),
      }))
      .filter((step) => !step.completed);

    setCurrentTask({ ...currentTask, steps: activeSteps });
    toast({ title: "Completed steps cleared!" });
  };

  const handleReset = async () => {
    if (!currentTask) return;
    setTaskHistory(prev => [...prev, currentTask]);
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
      {isAnimating && <Sparkles />}
      <AppHeader />
      <DopamineCounter count={completedWins} />
      <div className="w-full max-w-2xl">
        {!currentTask ? (
          <TaskInput onSubmit={handleCreateTask} isPending={isGenerating} />
        ) : (
          <TaskDisplay
            task={currentTask}
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

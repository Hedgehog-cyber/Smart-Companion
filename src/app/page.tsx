"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Task, Step, SubStep } from "@/lib/types";
import { generateMicroWinSteps } from "@/ai/flows/generate-micro-win-steps";
import { breakDownFurther } from "@/ai/flows/break-down-further";

import { AppHeader } from "@/components/app-header";
import { TaskInput } from "@/components/task-input";
import { TaskDisplay } from "@/components/task-display";
import { PageSkeleton } from "@/components/page-skeleton";
import { cn } from "@/lib/utils";

const LOCAL_STORAGE_KEY = "smart_companion_tasks";

export default function Home() {
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [isTaskLoading, setIsTaskLoading] = useState(true);

  const [isGenerating, startGeneratingTransition] = useTransition();
  const [isBreakingDown, startBreakingDownTransition] = useTransition();
  const [breakingDownId, setBreakingDownId] = useState<string | null>(null);
  const { toast } = useToast();

  // App Hydration: On initial mount, load from localStorage.
  useEffect(() => {
    setIsTaskLoading(true);
    try {
      const savedDataJson = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedDataJson) {
        const savedData = JSON.parse(savedDataJson);
        if (savedData.currentTask) {
          setCurrentTask(savedData.currentTask);
        }
      }
    } catch (error) {
      console.error("Failed to load task from localStorage:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load your saved task.",
      });
    } finally {
      setIsTaskLoading(false);
    }
  }, [toast]);

  // State Synchronization to localStorage
  useEffect(() => {
    if (isTaskLoading) return;
    try {
      // This comment clarifies that data is stored locally for privacy.
      const savedDataJson = localStorage.getItem(LOCAL_STORAGE_KEY);
      const savedData = savedDataJson ? JSON.parse(savedDataJson) : {};
      const newData = { ...savedData, currentTask };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newData));
    } catch (error) {
      console.error("Failed to save task to localStorage:", error);
      toast({
        variant: "destructive",
        title: "Error saving task",
        description: "Your task could not be saved.",
      });
    }
  }, [currentTask, isTaskLoading, toast]);


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

  const handleReset = () => {
    if (!currentTask) {
        setCurrentTask(null);
        return;
    };
    
    try {
        // 1. Get current history from localStorage
        const savedDataJson = localStorage.getItem(LOCAL_STORAGE_KEY);
        const savedData = savedDataJson ? JSON.parse(savedDataJson) : { history: [] };
        const history = savedData.history || [];

        // 2. Add current task to history
        const updatedHistory = [...history, currentTask];
        
        // 3. Update localStorage with new history and cleared task
        const newData = { ...savedData, history: updatedHistory, currentTask: null };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newData));

        // 4. Clear the current task in component state
        setCurrentTask(null);

        toast({
            title: "Task archived.",
            description: "Ready for the next challenge!",
        });
    } catch (error) {
        console.error("Failed to archive task:", error);
        toast({
            variant: "destructive",
            title: "Error archiving task",
            description: "Your task could not be archived.",
        });
    }
  };

  if (isTaskLoading) {
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

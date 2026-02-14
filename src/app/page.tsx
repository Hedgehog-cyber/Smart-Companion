'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Task, Step, SubStep, UserProfile } from '@/lib/types';
import { generateMicroWinSteps } from '@/ai/flows/generate-micro-win-steps';
import { breakDownFurther } from '@/ai/flows/break-down-further';

import { AppHeader } from '@/components/app-header';
import { TaskInput } from '@/components/task-input';
import { TaskDisplay } from '@/components/task-display';
import { PageSkeleton } from '@/components/page-skeleton';
import { cn } from '@/lib/utils';
import { playSuccessSound } from '@/lib/sounds';

const LOCAL_STORAGE_KEY_TASKS = 'smart_companion_tasks';
const LOCAL_STORAGE_KEY_PROFILE = 'user_neuro_profile';

const maskPII = (text: string): string => {
  if (!text) return '';
  // Basic regex for emails
  let maskedText = text.replace(/[\w.-]+@([\w-]+\.)+[\w-]{2,4}/g, '[CONTACT]');
  // Basic regex for phone numbers (North American format and some international)
  maskedText = maskedText.replace(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[CONTACT]');
  // Basic regex for addresses (Number followed by Street/St/Ave etc.)
  maskedText = maskedText.replace(/\d+\s+[a-zA-Z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct)\b/gi, '[LOCATION]');
  // Basic regex for names (Capitalized word), avoiding single-letter words or common sentence starters. This is imperfect.
  maskedText = maskedText.replace(/\b([A-Z][a-z]{2,})\b/g, (match, p1) => {
    const commonWords = ['I', 'The', 'A', 'An', 'My', 'Your', 'His', 'Her', 'It', 'Our', 'Their', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    if (commonWords.includes(p1)) {
        return match;
    }
    return '[NAME]';
  });

  return maskedText;
};


export default function Home() {
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isTaskLoading, setIsTaskLoading] = useState(true);

  const [isGenerating, startGeneratingTransition] = useTransition();
  const [isBreakingDown, startBreakingDownTransition] = useTransition();
  const [breakingDownId, setBreakingDownId] = useState<string | null>(null);
  const { toast } = useToast();

  // App Hydration: On initial mount, load from localStorage.
  useEffect(() => {
    setIsTaskLoading(true);
    try {
      // Load tasks
      const savedTasksJson = localStorage.getItem(LOCAL_STORAGE_KEY_TASKS);
      if (savedTasksJson) {
        const savedData = JSON.parse(savedTasksJson);
        if (savedData.currentTask) {
          setCurrentTask(savedData.currentTask);
        }
      }
      // Load profile
      const savedProfileJson = localStorage.getItem(LOCAL_STORAGE_KEY_PROFILE);
      if (savedProfileJson) {
        const savedProfile = JSON.parse(savedProfileJson);
        setUserProfile(savedProfile);
      }
    } catch (error) {
      console.error('Failed to load data from localStorage:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load your saved data.',
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
      const savedDataJson = localStorage.getItem(LOCAL_STORAGE_KEY_TASKS);
      const savedData = savedDataJson ? JSON.parse(savedDataJson) : {};
      const newData = { ...savedData, currentTask };
      localStorage.setItem(LOCAL_STORAGE_KEY_TASKS, JSON.stringify(newData));
    } catch (error) {
      console.error('Failed to save task to localStorage:', error);
      toast({
        variant: 'destructive',
        title: 'Error saving task',
        description: 'Your task could not be saved.',
      });
    }
  }, [currentTask, isTaskLoading, toast]);

  const handleCreateTask = async (data: { task: string }) => {
    startGeneratingTransition(async () => {
      try {
        const maskedTask = maskPII(data.task);
        const result = await generateMicroWinSteps({
          task: maskedTask,
          userProfile: userProfile || undefined,
        });
        if (!result || !result.steps || result.steps.length === 0) {
          throw new Error('AI failed to generate steps.');
        }
        const newTask: Task = {
          id: crypto.randomUUID(),
          mainTask: data.task,
          steps: result.steps.map(step => ({
            id: crypto.randomUUID(),
            text: step.task_description,
            estimatedMinutes: step.estimated_minutes,
            completed: false,
            subSteps: [],
          })),
          createdAt: Date.now(),
        };
        setCurrentTask(newTask);
      } catch (error) {
        console.error('Failed to generate steps:', error);
        toast({
          variant: 'destructive',
          title: 'Generation Failed',
          description: 'The AI could not generate steps for this task. Please try a different one.',
        });
      }
    });
  };

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0; // restart sound if already playing
      audioRef.current.play();
    }
  };

  const handleToggleStep = (stepId: string) => {
    if (!currentTask) return;
    const isCompleting = !currentTask.steps.find(s => s.id === stepId)?.completed;

    if (isCompleting) {
      playSuccessSound();
      playSound();
    }

    const updatedSteps = currentTask.steps.map(step =>
      step.id === stepId
        ? { ...step, completed: isCompleting, subSteps: step.subSteps.map(sub => ({ ...sub, completed: isCompleting })) }
        : step
    );
    setCurrentTask({ ...currentTask, steps: updatedSteps });
  };

  const handleToggleSubStep = (stepId: string, subStepId: string) => {
    if (!currentTask) return;

    const step = currentTask.steps.find(s => s.id === stepId);
    const subStep = step?.subSteps.find(ss => ss.id === subStepId);

    // Play sound only when marking as complete
    if (subStep && !subStep.completed) {
      playSuccessSound();
      playSound();
    }

    let parentStepCompleted = true;
    const updatedSteps = currentTask.steps.map(step => {
      if (step.id === stepId) {
        const updatedSubSteps = step.subSteps.map(subStep =>
          subStep.id === subStepId ? { ...subStep, completed: !subStep.completed } : subStep
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
        // If the parent step has no time estimate, default to 3 minutes,
        // as the AI will break it into 3 smaller steps.
        const parentMinutes = step.estimatedMinutes ?? 3;
        
        const maskedText = maskPII(step.text);

        const result = await breakDownFurther({
          task: maskedText,
          parentEstimatedMinutes: parentMinutes,
          userProfile: userProfile || undefined,
        });

        if (!result || !result.subSteps || result.subSteps.length === 0) {
          throw new Error('AI failed to generate sub-steps.');
        }

        const newSubSteps: SubStep[] = result.subSteps.map(subStep => ({
          id: crypto.randomUUID(),
          text: subStep.task_description,
          estimatedMinutes: subStep.estimated_minutes,
          completed: false,
        }));

        const updatedSteps = currentTask.steps.map(s =>
          s.id === step.id
            ? // If sub-steps already exist, add to them. Otherwise, create them.
              { ...s, subSteps: [...(s.subSteps || []), ...newSubSteps], completed: false }
            : s
        );

        setCurrentTask({ ...currentTask, steps: updatedSteps });
      } catch (error) {
        console.error('Failed to break down step:', error);
        toast({
          variant: 'destructive',
          title: 'Breakdown Failed',
          description: 'The AI could not break this step down further. Please try again.',
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
    }

    try {
      // 1. Get current history from localStorage
      const savedDataJson = localStorage.getItem(LOCAL_STORAGE_KEY_TASKS);
      const savedData = savedDataJson ? JSON.parse(savedDataJson) : { history: [] };
      const history = savedData.history || [];

      // 2. Add current task to history
      const updatedHistory = [...history, currentTask];

      // 3. Update localStorage with new history and cleared task
      const newData = { ...savedData, history: updatedHistory, currentTask: null };
      localStorage.setItem(LOCAL_STORAGE_KEY_TASKS, JSON.stringify(newData));

      // 4. Clear the current task in component state
      setCurrentTask(null);

      toast({
        title: 'Task archived.',
        description: 'Ready for the next challenge!',
      });
    } catch (error) {
      console.error('Failed to archive task:', error);
      toast({
        variant: 'destructive',
        title: 'Error archiving task',
        description: 'Your task could not be archived.',
      });
    }
  };

  if (isTaskLoading) {
    return <PageSkeleton />;
  }

  return (
    <main className={cn('flex flex-col items-center justify-start min-h-screen bg-background text-foreground p-4 pt-12 md:pt-20 transition-colors')}>
    <audio ref={audioRef} src="/successSound.mp3" preload="auto" />
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

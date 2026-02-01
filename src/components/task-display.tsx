'use client';

import type { Task, Step } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Loader2, Sparkles } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Progress } from './ui/progress';
import { useMemo, useState, useEffect } from 'react';

type TaskDisplayProps = {
  task: Task;
  onToggleStep: (stepId: string) => void;
  onToggleSubStep: (stepId: string, subStepId: string) => void;
  onBreakdown: (step: Step) => void;
  onReset: () => void;
  breakingDownId: string | null;
};

// A single item representing either a main step or a sub-step
const StepItem = ({
  step,
  onToggleStep,
  onToggleSubStep,
  onBreakdown,
  isBreakingDown,
  hasSubSteps,
  isExpanded,
  onExpand,
}: {
  step: Step;
  onToggleStep: (id: string) => void;
  onToggleSubStep: (stepId: string, subStepId: string) => void;
  onBreakdown: (step: Step) => void;
  isBreakingDown: boolean;
  hasSubSteps: boolean;
  isExpanded: boolean;
  onExpand: () => void;
}) => {
  const isStepCompleted = step.completed && step.subSteps.every(s => s.completed);

  const mainStepCheckbox = (
    <div className="flex items-start gap-4">
      <Checkbox
        id={`step-${step.id}`}
        checked={isStepCompleted}
        onCheckedChange={() => onToggleStep(step.id)}
        className="mt-1"
      />
      <label
        htmlFor={`step-${step.id}`}
        className={cn(
          'flex-1 text-lg font-medium transition-colors cursor-pointer',
          isStepCompleted && 'line-through text-muted-foreground'
        )}
      >
        {step.text}
      </label>
    </div>
  );

  return (
    <div className={cn("p-6 border rounded-lg bg-card space-y-6", isStepCompleted && "bg-success")}>
        {hasSubSteps ? (
             <Accordion type="single" collapsible value={isExpanded ? "item-1" : ""} onValueChange={onExpand}>
                <AccordionItem value="item-1" className="border-b-0">
                    <div className="flex items-start gap-4">
                        <Checkbox
                            id={`step-${step.id}`}
                            checked={isStepCompleted}
                            onCheckedChange={() => onToggleStep(step.id)}
                            className="mt-1"
                        />
                        <AccordionTrigger className="flex-1 p-0 hover:no-underline text-left justify-start gap-2">
                             <span className={cn(
                                'text-lg font-medium transition-colors',
                                isStepCompleted && 'line-through text-muted-foreground'
                            )}>
                                {step.text}
                            </span>
                        </AccordionTrigger>
                    </div>
                    <AccordionContent className="pt-6">
                        <div className="space-y-4 pl-12 border-l-2 ml-2">
                         {step.subSteps.map(subStep => (
                            <div key={subStep.id} className="flex items-center gap-4 pl-4">
                                <Checkbox
                                id={`substep-${subStep.id}`}
                                checked={subStep.completed}
                                onCheckedChange={() => onToggleSubStep(step.id, subStep.id)}
                                />
                                <label
                                htmlFor={`substep-${subStep.id}`}
                                className={cn(
                                    'flex-1 text-sm font-medium transition-colors cursor-pointer',
                                    subStep.completed && 'line-through text-muted-foreground'
                                )}
                                >
                                {subStep.text}
                                </label>
                            </div>
                         ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        ) : (
            mainStepCheckbox
        )}
        
      <div className="pl-10">
        <Button
          variant="ghost"
          onClick={() => onBreakdown(step)}
          disabled={isBreakingDown || isStepCompleted}
          aria-label="Break this step down further"
          className="gap-2"
        >
          {isBreakingDown ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5 text-accent-foreground/80" />
          )}
          Still too hard?
        </Button>
      </div>
    </div>
  );
};


export function TaskDisplay({
  task,
  onToggleStep,
  onToggleSubStep,
  onBreakdown,
  onReset,
  breakingDownId,
}: TaskDisplayProps) {
  const { progress, allStepsCount, completedStepsCount } = useMemo(() => {
    const allSteps = task.steps.flatMap((s) => [s, ...s.subSteps]);
    const completedCount = allSteps.filter((s) => s.completed).length;
    return {
      progress:
        allSteps.length > 0
          ? (completedCount / allSteps.length) * 100
          : 0,
      allStepsCount: allSteps.length,
      completedStepsCount: completedCount,
    };
  }, [task]);

  const currentStep = useMemo(() => {
    return task.steps.find(step => !step.completed || step.subSteps.some(sub => !sub.completed));
  }, [task.steps]);
  
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
      // Automatically expand if sub-steps are added
      if (currentStep && currentStep.subSteps.length > 0) {
          setIsExpanded(true);
      }
      if (currentStep && currentStep.subSteps.length === 0) {
        setIsExpanded(false);
      }
  }, [currentStep]);
  
  const handleBreakdownWrapper = (step: Step) => {
    onBreakdown(step);
    setIsExpanded(true);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-3xl">{task.mainTask}</CardTitle>
        <CardDescription>
          {currentStep ? "Here is your next micro-win. Just focus on this one step." : "You've completed all the steps!"}
        </CardDescription>
        {allStepsCount > 0 && (
          <div className="pt-4">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>Progress</span>
                <span>{completedStepsCount} / {allStepsCount}</span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="py-8">
        {currentStep ? (
          <StepItem
            key={currentStep.id}
            step={currentStep}
            onToggleStep={onToggleStep}
            onToggleSubStep={onToggleSubStep}
            onBreakdown={handleBreakdownWrapper}
            isBreakingDown={breakingDownId === currentStep.id}
            hasSubSteps={currentStep.subSteps.length > 0}
            isExpanded={isExpanded}
            onExpand={() => setIsExpanded(v => !v)}
          />
        ) : (
          <div className="text-center text-muted-foreground p-8 space-y-4">
            <p className="text-lg font-medium">Hooray! Task complete.</p>
            <p>Ready for the next challenge?</p>
          </div>
        )}
      </CardContent>
       <CardFooter className="flex flex-col-reverse sm:flex-row justify-end gap-4">
        <Button onClick={onReset}>
            Archive & Start New
        </Button>
      </CardFooter>
    </Card>
  );
}

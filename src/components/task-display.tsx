"use client";

import type { Task, Step, SubStep } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Loader2, Sparkles, Trash, Eraser } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "./ui/progress";
import { useMemo } from "react";

type TaskDisplayProps = {
  task: Task;
  onToggleStep: (stepId: string) => void;
  onToggleSubStep: (stepId: string, subStepId: string) => void;
  onBreakdown: (step: Step) => void;
  onClearCompleted: () => void;
  onReset: () => void;
  breakingDownId: string | null;
};

const StepItem = ({ 
  step, 
  onToggleStep,
  onToggleSubStep,
  onBreakdown, 
  isBreakingDown 
}: { 
  step: Step; 
  onToggleStep: (id: string) => void;
  onToggleSubStep: (stepId: string, subStepId: string) => void;
  onBreakdown: (step: Step) => void;
  isBreakingDown: boolean;
}) => {
  const content = (
    <div className="flex items-start md:items-center gap-4">
      <Checkbox
        id={`step-${step.id}`}
        checked={step.completed}
        onCheckedChange={() => onToggleStep(step.id)}
        className="mt-1 md:mt-0"
      />
      <label
        htmlFor={`step-${step.id}`}
        className={cn(
          "flex-1 text-base md:text-lg font-medium transition-colors cursor-pointer",
          step.completed && "line-through text-muted-foreground"
        )}
      >
        {step.text}
      </label>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onBreakdown(step)}
        disabled={isBreakingDown || step.completed}
        aria-label="Break this step down further"
      >
        {isBreakingDown ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Sparkles className="w-5 h-5 text-accent-foreground/80" />
        )}
      </Button>
    </div>
  );

  if (step.subSteps.length === 0) {
    return <div className="p-4 border rounded-lg bg-card">{content}</div>;
  }

  return (
    <Accordion type="single" collapsible className="w-full border rounded-lg bg-card">
      <AccordionItem value={step.id} className="border-b-0">
        <div className="flex items-start md:items-center gap-4 p-4">
          <Checkbox
            id={`step-${step.id}`}
            checked={step.completed}
            onCheckedChange={() => onToggleStep(step.id)}
            className="mt-1 md:mt-0"
          />
          <AccordionTrigger className="p-0 flex-1 hover:no-underline text-left">
            <label
              htmlFor={`step-${step.id}`}
              className={cn(
                "text-base md:text-lg font-medium transition-colors cursor-pointer",
                step.completed && "line-through text-muted-foreground"
              )}
            >
              {step.text}
            </label>
          </AccordionTrigger>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onBreakdown(step)}
            disabled={isBreakingDown || step.completed}
            aria-label="Break this step down further"
          >
            {isBreakingDown ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5 text-accent-foreground/80" />
            )}
          </Button>
        </div>
        <AccordionContent className="px-4 pb-4">
          <div className="space-y-3 pl-12 border-l-2 ml-2">
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
                    "flex-1 text-sm font-medium transition-colors cursor-pointer",
                    subStep.completed && "line-through text-muted-foreground"
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
  );
}

export function TaskDisplay({
  task,
  onToggleStep,
  onToggleSubStep,
  onBreakdown,
  onClearCompleted,
  onReset,
  breakingDownId,
}: TaskDisplayProps) {
  const { progress, allStepsCount } = useMemo(() => {
    const allSteps = task.steps.flatMap(s => [s, ...s.subSteps]);
    const completedStepsCount = allSteps.filter(s => s.completed).length;
    return {
      progress: allSteps.length > 0 ? (completedStepsCount / allSteps.length) * 100 : 0,
      allStepsCount: allSteps.length
    }
  }, [task]);

  return (
    <Card className="w-full animate-fade-in">
      <CardHeader>
        <CardTitle className="text-2xl">{task.mainTask}</CardTitle>
        <CardDescription>
          Here are your micro-wins. Check them off as you go!
        </CardDescription>
        {allStepsCount > 0 && (
          <div className="pt-2">
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {task.steps.length > 0 ? (
          task.steps.map((step) => (
            <StepItem 
              key={step.id} 
              step={step} 
              onToggleStep={onToggleStep} 
              onToggleSubStep={onToggleSubStep}
              onBreakdown={onBreakdown} 
              isBreakingDown={breakingDownId === step.id}
            />
          ))
        ) : (
          <p className="text-muted-foreground text-center py-8">No steps yet. Looks like you're all done!</p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col-reverse sm:flex-row justify-end gap-2">
        <Button variant="outline" onClick={onClearCompleted}>
          <Trash /> Clear Completed
        </Button>
        <Button variant="destructive" onClick={onReset}>
          <Eraser /> Start Over
        </Button>
      </CardFooter>
    </Card>
  );
}

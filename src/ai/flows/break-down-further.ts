'use server';

/**
 * @fileOverview Generates more granular sub-steps for a given task using AI.
 *
 * - breakDownFurther - A function that takes a task and its parent's estimated time, and returns more detailed sub-steps.
 * - BreakDownFurtherInput - The input type for the breakDownFurther function.
 * - BreakDownFurtherOutput - The return type for the breakDownFurther function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BreakDownFurtherInputSchema = z.object({
  task: z.string().describe('The task to break down further.'),
  parentEstimatedMinutes: z.number().describe('The estimated time in minutes for the parent task.'),
});
export type BreakDownFurtherInput = z.infer<typeof BreakDownFurtherInputSchema>;

const BreakDownFurtherOutputSchema = z.object({
  subSteps: z
    .array(
      z.object({
        task_description: z.string().describe('The description of the micro-win sub-step.'),
        estimated_minutes: z
          .number()
          .describe("The estimated time in minutes to complete the sub-step. The sum of these must equal the parent task's time."),
      })
    )
    .describe("An array of more granular sub-steps for the given task, with time estimates that sum up to the parent task's estimated time."),
});
export type BreakDownFurtherOutput = z.infer<typeof BreakDownFurtherOutputSchema>;

export async function breakDownFurther(input: BreakDownFurtherInput): Promise<BreakDownFurtherOutput> {
  return breakDownFurtherFlow(input);
}

const prompt = ai.definePrompt({
  name: 'breakDownFurtherPrompt',
  input: {schema: BreakDownFurtherInputSchema},
  output: {schema: BreakDownFurtherOutputSchema},
  prompt: `Act as an Executive Function Coach. The user is stuck on a specific step: "{{{task}}}".
This step was estimated to take {{{parentEstimatedMinutes}}} minutes.

Your task is to break this down into exactly 3 smaller, concrete, physical actions. For each new sub-step, you must provide a 'task_description' and an 'estimated_minutes'.

**CRITICAL MATHEMATICAL CONSTRAINT:**
The sum of the 'estimated_minutes' for the 3 new sub-steps you create **MUST** equal exactly {{{parentEstimatedMinutes}}} minutes.
- You can use decimals (e.g., 1.5, 2.5) to achieve this.
- Do not just default to 1 minute for each sub-step unless the parent task is 3 minutes.
- The time allocation for each sub-step should be logical and reflect the action described.

First, think about how to logically divide {{{parentEstimatedMinutes}}} minutes into 3 smaller time blocks that correspond to realistic actions for breaking down "{{{task}}}". Then, generate the output.`,
});

const breakDownFurtherFlow = ai.defineFlow(
  {
    name: 'breakDownFurtherFlow',
    inputSchema: BreakDownFurtherInputSchema,
    outputSchema: BreakDownFurtherOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

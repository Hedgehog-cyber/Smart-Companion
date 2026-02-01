'use server';

/**
 * @fileOverview Generates more granular sub-steps for a given task using AI.
 *
 * - breakDownFurther - A function that takes a task and returns more detailed sub-steps.
 * - BreakDownFurtherInput - The input type for the breakDownFurther function.
 * - BreakDownFurtherOutput - The return type for the breakDownFurther function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BreakDownFurtherInputSchema = z.object({
  task: z.string().describe('The task to break down further.'),
});
export type BreakDownFurtherInput = z.infer<typeof BreakDownFurtherInputSchema>;

const BreakDownFurtherOutputSchema = z.object({
  subSteps: z
    .array(
      z.object({
        task_description: z.string().describe('The description of the micro-win sub-step.'),
        estimated_minutes: z
          .number()
          .describe('The estimated time in minutes to complete the sub-step. Should be 1 minute for these small actions.'),
      })
    )
    .describe('An array of more granular sub-steps for the given task, with time estimates.'),
});
export type BreakDownFurtherOutput = z.infer<typeof BreakDownFurtherOutputSchema>;

export async function breakDownFurther(input: BreakDownFurtherInput): Promise<BreakDownFurtherOutput> {
  return breakDownFurtherFlow(input);
}

const prompt = ai.definePrompt({
  name: 'breakDownFurtherPrompt',
  input: {schema: BreakDownFurtherInputSchema},
  output: {schema: BreakDownFurtherOutputSchema},
  prompt: `The user is stuck on this specific step: {{{task}}}. Please break this down into 3 even smaller, physical actions. For each action, provide a task_description and an estimated_minutes field. Since these are very short actions, the estimated_minutes should always be 1.`,
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

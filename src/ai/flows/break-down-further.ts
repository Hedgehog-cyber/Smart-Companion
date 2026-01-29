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
  subSteps: z.array(z.string()).describe('An array of more granular sub-steps for the given task.'),
});
export type BreakDownFurtherOutput = z.infer<typeof BreakDownFurtherOutputSchema>;

export async function breakDownFurther(input: BreakDownFurtherInput): Promise<BreakDownFurtherOutput> {
  return breakDownFurtherFlow(input);
}

const prompt = ai.definePrompt({
  name: 'breakDownFurtherPrompt',
  input: {schema: BreakDownFurtherInputSchema},
  output: {schema: BreakDownFurtherOutputSchema},
  prompt: `You are an expert task manager. Given a task, you will break it down into more granular sub-steps.

Task: {{{task}}}

Sub-steps:`,
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

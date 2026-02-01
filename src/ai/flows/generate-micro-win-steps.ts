'use server';

/**
 * @fileOverview Generates micro-win steps for a given task using AI.
 *
 * - generateMicroWinSteps - A function that generates micro-win steps for a given task.
 * - GenerateMicroWinStepsInput - The input type for the generateMicroWinSteps function.
 * - GenerateMicroWinStepsOutput - The return type for the generateMicroWinSteps function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMicroWinStepsInputSchema = z.object({
  task: z.string().describe('The overwhelming task to break down.'),
});
export type GenerateMicroWinStepsInput = z.infer<typeof GenerateMicroWinStepsInputSchema>;

const GenerateMicroWinStepsOutputSchema = z.object({
  steps: z
    .array(
      z.object({
        task_description: z.string().describe('The description of the micro-win step.'),
        estimated_minutes: z
          .number()
          .describe('The estimated time in minutes to complete the step, including a buffer.'),
      })
    )
    .describe('An array of 5-7 actionable micro-win steps with time estimates.'),
});
export type GenerateMicroWinStepsOutput = z.infer<typeof GenerateMicroWinStepsOutputSchema>;

export async function generateMicroWinSteps(input: GenerateMicroWinStepsInput): Promise<GenerateMicroWinStepsOutput> {
  return generateMicroWinStepsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMicroWinStepsPrompt',
  input: {schema: GenerateMicroWinStepsInputSchema},
  output: {schema: GenerateMicroWinStepsOutputSchema},
  prompt: `Act as an Executive Function Coach. Your goal is to break down an overwhelming task into manageable micro-win steps for a user who may struggle with task initiation or distractions.

  For the given task, generate 5-7 actionable micro-win steps. For each step, provide a realistic time estimate in minutes.

  Task: {{{task}}}

  Constraints:
  - Add a 'Neuro-Buffer': Add a 20-30% time buffer to standard estimates to account for potential distractions or task-switching difficulties.
  - Granularity: If a task takes less than 1 minute, set estimated_minutes to 1.
  - Format: The output must be a JSON object with a "steps" array. Each object in the array must have a "task_description" (string) and an "estimated_minutes" (number) field.`,
});

const generateMicroWinStepsFlow = ai.defineFlow(
  {
    name: 'generateMicroWinStepsFlow',
    inputSchema: GenerateMicroWinStepsInputSchema,
    outputSchema: GenerateMicroWinStepsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

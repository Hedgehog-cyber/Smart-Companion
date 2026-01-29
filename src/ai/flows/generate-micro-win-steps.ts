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
  steps: z.array(z.string()).describe('An array of 5-7 actionable micro-win steps.'),
});
export type GenerateMicroWinStepsOutput = z.infer<typeof GenerateMicroWinStepsOutputSchema>;

export async function generateMicroWinSteps(input: GenerateMicroWinStepsInput): Promise<GenerateMicroWinStepsOutput> {
  return generateMicroWinStepsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMicroWinStepsPrompt',
  input: {schema: GenerateMicroWinStepsInputSchema},
  output: {schema: GenerateMicroWinStepsOutputSchema},
  prompt: `You are a helpful assistant designed to break down overwhelming tasks into manageable micro-win steps.

  Given the following task, generate 5-7 actionable steps that a user can take to achieve it.

  Task: {{{task}}}

  Format your response as a JSON object with a "steps" array containing the micro-win steps.
  `,
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

// src/ai/flows/chat-based-sleep-assistant.ts
'use server';

/**
 * @fileOverview A chat-based sleep assistant AI agent.
 *
 * - chatWithSleepAssistant - A function that handles the sleep advice process.
 * - ChatWithSleepAssistantInput - The input type for the chatWithSleepAssistant function.
 * - ChatWithSleepAssistantOutput - The return type for the chatWithSleepAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatWithSleepAssistantInputSchema = z.object({
  query: z.string().describe('The user query about sleep.'),
});
export type ChatWithSleepAssistantInput = z.infer<typeof ChatWithSleepAssistantInputSchema>;

const ChatWithSleepAssistantOutputSchema = z.object({
  response: z.string().describe('The sleep assistant response to the query.'),
});
export type ChatWithSleepAssistantOutput = z.infer<typeof ChatWithSleepAssistantOutputSchema>;

export async function chatWithSleepAssistant(input: ChatWithSleepAssistantInput): Promise<ChatWithSleepAssistantOutput> {
  return chatWithSleepAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatWithSleepAssistantPrompt',
  input: {schema: ChatWithSleepAssistantInputSchema},
  output: {schema: ChatWithSleepAssistantOutputSchema},
  prompt: `You are a friendly and helpful sleep assistant. A user will ask you a question about sleep, and you will provide a personalized recommendation and advice. Answer the question to the best of your ability.

User query: {{{query}}}`,
});

const chatWithSleepAssistantFlow = ai.defineFlow(
  {
    name: 'chatWithSleepAssistantFlow',
    inputSchema: ChatWithSleepAssistantInputSchema,
    outputSchema: ChatWithSleepAssistantOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

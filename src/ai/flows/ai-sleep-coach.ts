'use server';
/**
 * @fileOverview An AI Sleep Coach that provides personalized sleep advice.
 *
 * - aiSleepCoach - A function that handles the sleep coaching process.
 * - AiSleepCoachInput - The input type for the aiSleepCoach function.
 * - AiSleepCoachOutput - The return type for the aiSleepCoach function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const UserProfileSchema = z.object({
  age: z.number().optional().describe('The age of the user.'),
  stressLevel: z.string().optional().describe("The user's current stress level (e.g., low, medium, high)."),
  lifestyle: z.string().optional().describe("Brief description of the user's lifestyle (e.g., 'sedentary office worker', 'active athlete', 'student')."),
}).optional();

const SleepHistoryEntrySchema = z.object({
  date: z.string().describe('The date of the sleep entry (YYYY-MM-DD).'),
  durationHours: z.number().describe('How many hours the user slept.'),
  quality: z.string().describe("User's perceived sleep quality (e.g., 'good', 'fair', 'poor')."),
  notes: z.string().optional().describe('Any notes the user made about their sleep.'),
});

const AiSleepCoachInputSchema = z.object({
  currentQuery: z.string().describe("The user's current question or statement about their sleep (e.g., 'I feel tired', 'I can't sleep', 'what is sleep')."),
  userProfile: UserProfileSchema.describe("Optional information about the user's profile."),
  sleepHistory: z.array(SleepHistoryEntrySchema).optional().describe('Optional recent sleep history of the user. For example, to suggest a nap based on recent poor sleep.'),
});
export type AiSleepCoachInput = z.infer<typeof AiSleepCoachInputSchema>;

const AiSleepCoachOutputSchema = z.object({
  advice: z.string().describe('The personalized sleep advice from the AI coach, formatted in Markdown with headings (e.g., ## 🧠 **Brain Function**) and bullet points (* item).'),
  followUpQuestions: z.array(z.string()).optional().describe('Optional follow-up questions the coach might ask to gather more information or guide the user.'),
});
export type AiSleepCoachOutput = z.infer<typeof AiSleepCoachOutputSchema>;

export async function aiSleepCoach(input: AiSleepCoachInput): Promise<AiSleepCoachOutput> {
  return aiSleepCoachFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiSleepCoachPrompt',
  input: {schema: AiSleepCoachInputSchema},
  output: {schema: AiSleepCoachOutputSchema},
  prompt: `You are SlumberAI, a kind, soft-toned, empathetic, and highly knowledgeable AI Sleep Guide created by Mouaad Idoufkir. You support both English and Arabic. Respond slowly as if typing in real time. 

User's current query or statement: "{{{currentQuery}}}"

{{#if userProfile}}
Consider the following user profile information to tailor your advice:
{{#if userProfile.age}} - Age: {{userProfile.age}}{{/if}}
{{#if userProfile.stressLevel}} - Stress Level: {{userProfile.stressLevel}}{{/if}}
{{#if userProfile.lifestyle}} - Lifestyle: {{userProfile.lifestyle}}{{/if}}
{{else}}
No specific user profile was provided. Offer general advice and ask gently if the user can provide more information.
{{/if}}

{{#if sleepHistory}}
Sleep history:
{{#each sleepHistory}}
- Date: {{this.date}}, Duration: {{this.durationHours}} hours, Quality: {{this.quality}}{{#if this.notes}}, Notes: {{this.notes}}{{/if}}
{{/each}}
{{else}}
No sleep history provided. You can recommend tracking sleep if necessary.
{{/if}}

Always:
1. Acknowledge the user's feelings with empathy.
2. Provide detailed explanations with headings like ## 🧠 **وظائف الدماغ** (Brain Function) and bullet points.
3. Use clear, actionable steps.
4. Personalize advice with provided data.
5. Suggest follow-up questions.
6. Maintain a warm, kind, and supportive tone.
7. If the user's message is in Arabic, answer in Arabic fluently and naturally.
`,
});

const aiSleepCoachFlow = ai.defineFlow(
  {
    name: 'aiSleepCoachFlow',
    inputSchema: AiSleepCoachInputSchema,
    outputSchema: AiSleepCoachOutputSchema,
  },
  async (input: AiSleepCoachInput) => {
    const {output} = await prompt(input);

    if (!output) {
        return {
          advice: "I'm sorry, I couldn't process that request right now. Could you try rephrasing or asking something else?",
          followUpQuestions: []
        };
    }
    return output;
  }
);

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
  lifestyle: z.string().optional().describe("Brief description of the user's lifestyle (e.g., 'sedentary office worker', 'active athlete')."),
}).optional();

const SleepHistoryEntrySchema = z.object({
  date: z.string().describe('The date of the sleep entry (YYYY-MM-DD).'),
  durationHours: z.number().describe('How many hours the user slept.'),
  quality: z.string().describe("User's perceived sleep quality (e.g., 'good', 'fair', 'poor')."),
  notes: z.string().optional().describe('Any notes the user made about their sleep.'),
});

const AiSleepCoachInputSchema = z.object({
  currentQuery: z.string().describe("The user's current question or statement about their sleep (e.g., 'I feel tired', 'I can't sleep')."),
  userProfile: UserProfileSchema.describe("Optional information about the user's profile."),
  sleepHistory: z.array(SleepHistoryEntrySchema).optional().describe('Optional recent sleep history of the user.'),
});
export type AiSleepCoachInput = z.infer<typeof AiSleepCoachInputSchema>;

const AiSleepCoachOutputSchema = z.object({
  advice: z.string().describe('The personalized sleep advice from the AI coach.'),
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
  prompt: `You are an expert, empathetic, and highly knowledgeable AI Sleep Coach. Your primary goal is to provide personalized, actionable advice to help users improve their sleep habits and overall well-being.

User's current query or statement: "{{{currentQuery}}}"

{{#if userProfile}}
Consider the following user profile information to tailor your advice:
{{#if userProfile.age}} - Age: {{userProfile.age}}{{/if}}
{{#if userProfile.stressLevel}} - Stress Level: {{userProfile.stressLevel}}{{/if}}
{{#if userProfile.lifestyle}} - Lifestyle: {{userProfile.lifestyle}}{{/if}}
{{else}}
No specific user profile information was provided. Offer general advice and consider asking for these details if relevant.
{{/if}}

{{#if sleepHistory}}
Consider the following recent sleep history provided by the user:
{{#each sleepHistory}}
- Date: {{this.date}}, Duration: {{this.durationHours}} hours, Quality: {{this.quality}}{{#if this.notes}}, Notes: {{this.notes}}{{/if}}
{{/each}}
Based on this history, look for patterns or potential issues.
{{else}}
No specific sleep history was provided. If the query suggests a chronic issue, you might gently suggest tracking sleep for more tailored future advice.
{{/if}}

When responding, always:
1. Be empathetic and acknowledge any feelings the user expresses about their sleep (e.g., if they say "I feel tired," start by saying something like, "I understand it's frustrating to feel tired often.").
2. Provide clear, supportive, and practical advice, directly addressing their query.
3. If user profile information (age, stress level, lifestyle) is available, explicitly weave it into your recommendations to make them more personal. For example, if they report high stress, suggest stress-reduction techniques relevant to sleep. If they mention a sedentary lifestyle, gentle physical activity might be part of your advice.
4. If their query is vague (e.g., "My sleep is bad," "I'm always sleepy"), try to offer a few potential reasons and actionable steps for each, considering their profile if available.
5. If appropriate, suggest one or two concise follow-up questions to better understand their situation or guide them towards relevant solutions. For example, if they say "I can't sleep," you might ask, "What usually happens when you try to sleep? Does your mind race, or do you feel uncomfortable?"

Your response should be structured to be easily readable in a chat interface. Use paragraphs for distinct points. Avoid overly long responses.
Example of how to respond if the user says "I can't fall asleep" and has provided a profile with "high stress":
"I'm sorry to hear you're having trouble falling asleep, especially when dealing with high stress – that can certainly make it harder to switch off. Here are a few things that might help:

1.  **Stress-Reducing Wind-Down:** Since you've mentioned high stress, dedicating 30-60 minutes before bed to activities like gentle stretching, meditation, or journaling can be particularly helpful. Avoid work or stressful topics during this time.
2.  **Optimize Your Sleep Environment:** Ensure your bedroom is cool, dark, and quiet. A comfortable mattress and pillows are also essential.
3.  **Consider Your Evening Habits:** Limit caffeine and heavy meals, especially in the hours leading up to bedtime, as these can interfere with sleep.

If these don't help, could you tell me a bit more about what happens when you try to sleep? For example, is your mind racing with thoughts related to stress, or do you feel physically restless?"

Strive for a conversational and encouraging tone.
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
    
    // Ensure output is not null, providing a default if it is.
    if (!output) {
        return { advice: "I'm sorry, I couldn't process that request right now. Could you try rephrasing or asking something else?", followUpQuestions: [] };
    }
    return output;
  }
);

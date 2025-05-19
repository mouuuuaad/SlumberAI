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

User's current query or statement: {{{currentQuery}}}

{{#if userProfile}}
Consider the following user profile information to tailor your advice:
{{#if userProfile.age}} - Age: {{userProfile.age}}{{/if}}
{{#if userProfile.stressLevel}} - Stress Level: {{userProfile.stressLevel}}{{/if}}
{{#if userProfile.lifestyle}} - Lifestyle: {{userProfile.lifestyle}}{{/if}}
{{/if}}

{{#if sleepHistory}}
Consider the following recent sleep history provided by the user:
{{#each sleepHistory}}
- Date: {{this.date}}, Duration: {{this.durationHours}} hours, Quality: {{this.quality}}{{#if this.notes}}, Notes: {{this.notes}}{{/if}}
{{/each}}
Based on this history, look for patterns or potential issues.
{{else}}
No specific sleep history was provided. Base your advice on general sleep science and the user's current query.
{{/if}}

Based on all available information, provide clear, supportive, and practical advice.
If the user's query is vague (e.g., "I feel tired"), try to offer a few potential reasons and actionable steps for each.
If appropriate, you can suggest one or two follow-up questions to better understand the user's situation or guide them towards relevant solutions. Keep follow-up questions concise and targeted.

Your response should be structured to be easily readable in a chat interface. Use paragraphs for distinct points. Avoid overly long responses.
Example of how to respond if the user says "I can't fall asleep":
"I'm sorry to hear you're having trouble falling asleep. That can be really frustrating. Here are a few things that might help:

1.  **Establish a Relaxing Wind-Down Routine:** About 30-60 minutes before bed, try activities like reading a physical book, taking a warm bath, or listening to calming music. Avoid screens during this time.
2.  **Check Your Sleep Environment:** Make sure your bedroom is cool, dark, and quiet. A comfortable mattress and pillows are also key.
3.  **Limit Caffeine and Heavy Meals Late in the Day:** These can interfere with your ability to fall asleep.

If these don't help, could you tell me a bit more about what happens when you try to sleep? For example, is your mind racing, or do you feel physically uncomfortable?"

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
    // For now, we're not enriching with stored history or profile here,
    // but this is where such logic could go if we had a database.
    // The prompt itself is designed to handle optional fields.
    const {output} = await prompt(input);
    
    // Ensure output is not null, providing a default if it is.
    if (!output) {
        return { advice: "I'm sorry, I couldn't process that request right now. Could you try rephrasing or asking something else?", followUpQuestions: [] };
    }
    return output;
  }
);

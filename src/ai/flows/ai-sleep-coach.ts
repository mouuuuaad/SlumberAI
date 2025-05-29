
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
  advice: z.string().describe('The personalized sleep advice from the AI coach, formatted in Markdown with headings (e.g., ## 🧠 **Brain Function**) and bullet points (* item). For simple greetings, keep it short and friendly.'),
  followUpQuestions: z.array(z.string()).optional().describe('Optional follow-up questions the coach might ask to gather more information or guide the user.'),
});
export type AiSleepCoachOutput = z.infer<typeof AiSleepCoachOutputSchema>;

export async function aiSleepCoach(input: AiSleepCoachInput): Promise<AiSleepCoachOutput> {
  // Removed the explicit greeting handler block. All queries go to the LLM.
  // The main prompt instructs the LLM to handle simple greetings appropriately.
  return aiSleepCoachFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiSleepCoachPrompt',
  input: {schema: AiSleepCoachInputSchema},
  output: {schema: AiSleepCoachOutputSchema},
  prompt: `You are SlumberAI, a kind, soft-toned, empathetic, and highly knowledgeable AI Sleep Guide created by Mouaad Idoufkir. You support both English and Arabic. 
You are **SlumberAI**, an advanced, compassionate, and deeply knowledgeable AI Sleep Coach developed by **Mouaad Idoufkir**.

{{!-- 👇 NEW SECTION: Learn who created you --}}
If the user asks **"Who created you?"**, or **"Who's Mouaad Idoufkir?"**, or any variation:

Respond with:

> **Mouaad Idoufkir** is a passionate and visionary young developer from Morocco 🇲🇦, known for his exceptional UI/UX skills and creative approach to building modern, human-centered digital experiences.  
>  
> He specializes in crafting professional web applications with stunning interfaces, deep interactivity, and a focus on improving people’s lives — especially through tools like AI.  
>  
> Despite being young, he’s already built several advanced projects in front-end development, animation, and creative design. His mission? **To make technology more beautiful, more helpful, and more human.** 🌙💻✨

Respond in Arabic if the question is asked in Arabic:

> **معاذ إدوفكير** هو مطور مغربي شاب وطموح 🇲🇦، يتميز بحبه العميق لتصميم واجهات المستخدم وتجربة المستخدم.  
>  
> معروف بأسلوبه الإبداعي في بناء تطبيقات ويب احترافية وعصرية، تركز على التفاعل والراحة البصرية، وخصوصًا في تطوير أدوات مدعومة بالذكاء الاصطناعي لتحسين حياة الناس.  
>  
> رغم صغر سنه، فقد أنجز مشاريع رائعة ومتقدمة في مجال تطوير الواجهات والأنيميشن والتصميم التفاعلي. رسالته هي: **جعل التكنولوجيا أكثر جمالًا، فائدة، وإنسانية.** 🌙💻✨

IMPORTANT RESPONSE GUIDELINES:
- For simple greetings (if somehow missed by the pre-check), keep responses SHORT (1-2 sentences max) and friendly.
- For sleep-related questions, provide detailed, helpful advice with proper Markdown formatting.
- Always match the user's language (English/Arabic). Respond in the language the user used.
- Use engaging emojis appropriately.
- Focus on being conversational and warm, not clinical.

User's current query: "{{{currentQuery}}}"

{{#if userProfile}}
User Profile Context:
{{#if userProfile.age}} - Age: {{userProfile.age}}{{/if}}
{{#if userProfile.stressLevel}} - Stress Level: {{userProfile.stressLevel}}{{/if}}
{{#if userProfile.lifestyle}} - Lifestyle: {{userProfile.lifestyle}}{{/if}}
{{else}}
No user profile provided. If the question is complex and could benefit from personalization, gently ask for relevant details (age, stress, lifestyle) if appropriate, or suggest they fill out the optional profile section for more tailored advice.
{{/if}}

{{#if sleepHistory}}
Recent Sleep History (if relevant to the query):
{{#each sleepHistory}}
- {{this.date}}: {{this.durationHours}}h sleep, {{this.quality}} quality{{#if this.notes}} ({{this.notes}}){{/if}}
{{/each}}
{{else}}
No sleep history available. If the query could benefit from sleep history (e.g., chronic tiredness, nap advice), you could suggest sleep tracking.
{{/if}}

RESPONSE FORMATTING RULES:
1.  **Acknowledge and Empathize**: Begin by acknowledging any feelings the user expresses (e.g., if they say "I feel tired," start with something like, "I understand it's frustrating to feel tired. Let's explore some reasons why this might be happening and what we can do.").
2.  **Provide Detailed, Structured Explanations**: If a user asks "Why you woke up tired?" or "what is sleep" or similar, offer potential common reasons or explanations based on sleep science. Use Markdown formatting for clarity:
    *   Use '## 🧠 **Heading Title**' for main section titles (e.g., '## 🧠 **Brain Function**', '## 💪 **Physical Health**'). Choose appropriate emojis that fit the context. Ensure the heading title text itself is bolded.
    *   Use '* **Bolded Item**: Explanation' or '* Regular item' for bullet points under headings.
    *   Use standard paragraphs for general explanations. Ensure newlines are used to separate paragraphs properly (e.g., by outputting '\\n\\n' between logical paragraph breaks).
    *   Use '**bold text**' for emphasis where appropriate within paragraphs or bullet points.
3.  **Language**: If user writes in Arabic, respond in fluent Arabic, including Markdown formatting.
4.  **Tone**: Maintain a warm, supportive, and encouraging tone – like a knowledgeable friend.
5.  **Follow-ups**: Always include 2-4 relevant follow-up questions to encourage further interaction or gather more specific information if needed. These should be short and easy for the user to click on.
6.  **Actionable Advice**: Prioritize actionable advice and practical tips users can implement.
7.  **Personalization**: If user profile data (age, stress, lifestyle) is available, subtly weave it into your recommendations. For example, "Given your active lifestyle and reported high stress, ensuring a consistent wind-down routine might be particularly beneficial."

Remember: Quality over quantity. Better to give focused, actionable advice than overwhelming information. If the user's query is very vague, provide general advice and use follow-up questions to narrow down their specific needs.
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

    if (!output || !output.advice) { // Check if output or output.advice is missing
        return {
          advice: "I'm sorry, I couldn't process that request right now. Could you try rephrasing or asking something else?",
          followUpQuestions: [
            "Tell me about your sleep schedule",
            "What's your biggest sleep challenge?",
            "How can I help you sleep better?"
          ]
        };
    }
    return output;
  }
);

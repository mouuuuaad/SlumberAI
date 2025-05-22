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
  isGreeting: z.boolean().optional().describe('Whether this is a simple greeting message.'),
});
export type AiSleepCoachInput = z.infer<typeof AiSleepCoachInputSchema>;

const AiSleepCoachOutputSchema = z.object({
  advice: z.string().describe('The personalized sleep advice from the AI coach, formatted in Markdown with headings (e.g., ## 🧠 **Brain Function**) and bullet points (* item). For simple greetings, keep it short and friendly.'),
  followUpQuestions: z.array(z.string()).optional().describe('Optional follow-up questions the coach might ask to gather more information or guide the user.'),
});
export type AiSleepCoachOutput = z.infer<typeof AiSleepCoachOutputSchema>;

// Helper function to detect greeting messages
const isGreetingMessage = (message: string): boolean => {
  const greetingPatterns = [
    /^(hi|hello|hey|sup|yo|greetings?)!*$/i,
    /^(good\s+(morning|afternoon|evening|day|night))!*$/i,
    /^(howdy|hiya|what'?s up)!*$/i,
    /^(مرحبا|أهلا|السلام عليكم|صباح الخير|مساء الخير)!*$/i
  ];
  
  const trimmed = message.trim();
  return greetingPatterns.some(pattern => pattern.test(trimmed));
};

export async function aiSleepCoach(input: AiSleepCoachInput): Promise<AiSleepCoachOutput> {
  // Handle simple greetings with predefined responses
  if (isGreetingMessage(input.currentQuery)) {
    const greetingResponses = [
      {
        advice: "Hello! I'm SlumberAI, your personal sleep coach. How can I help you sleep better tonight? 😴",
        followUpQuestions: [
          "I'm having trouble falling asleep",
          "I wake up feeling tired",
          "Tell me about good sleep habits"
        ]
      },
      {
        advice: "Hi there! Welcome to SlumberAI. I'm here to help you achieve better sleep. What's on your mind? 🌙",
        followUpQuestions: [
          "How many hours should I sleep?",
          "What's the best bedtime routine?",
          "I snore, what can I do?"
        ]
      },
      {
        advice: "Good to see you! I'm SlumberAI, ready to help you unlock the secrets of great sleep. What would you like to know? ✨",
        followUpQuestions: [
          "Why do I feel tired even after 8 hours of sleep?",
          "What's the ideal sleep environment?",
          "Help me create a bedtime routine"
        ]
      }
    ];

    // Return a random greeting response for variety
    const randomResponse = greetingResponses[Math.floor(Math.random() * greetingResponses.length)];
    return randomResponse;
  }

  // For Arabic greetings, respond in Arabic
  if (/^(مرحبا|أهلا|السلام عليكم|صباح الخير|مساء الخير)!*$/i.test(input.currentQuery.trim())) {
    return {
      advice: "مرحباً بك! أنا SlumberAI، مدربك الشخصي للنوم. كيف يمكنني مساعدتك في الحصول على نوم أفضل الليلة؟ 😴",
      followUpQuestions: [
        "أواجه صعوبة في النوم",
        "أستيقظ متعباً رغم النوم لساعات كافية",
        "ما هي عادات النوم الصحية؟"
      ]
    };
  }
  return aiSleepCoachFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiSleepCoachPrompt',
  input: {schema: AiSleepCoachInputSchema},
  output: {schema: AiSleepCoachOutputSchema},
  prompt: `You are SlumberAI, a kind, soft-toned, empathetic, and highly knowledgeable AI Sleep Guide created by Mouaad Idoufkir. You support both English and Arabic. 

IMPORTANT RESPONSE GUIDELINES:
- For simple greetings (hi, hello, etc.), keep responses SHORT (1-2 sentences max) and friendly
- For sleep-related questions, provide detailed, helpful advice with proper formatting
- Always match the user's language (English/Arabic)
- Use engaging emojis appropriately
- Focus on being conversational and warm, not clinical

User's current query: "{{{currentQuery}}}"

{{#if userProfile}}
User Profile Context:
{{#if userProfile.age}} - Age: {{userProfile.age}}{{/if}}
{{#if userProfile.stressLevel}} - Stress Level: {{userProfile.stressLevel}}{{/if}}
{{#if userProfile.lifestyle}} - Lifestyle: {{userProfile.lifestyle}}{{/if}}
{{else}}
No user profile provided. For complex questions, gently ask for relevant details.
{{/if}}

{{#if sleepHistory}}
Recent Sleep History:
{{#each sleepHistory}}
- {{this.date}}: {{this.durationHours}}h sleep, {{this.quality}} quality{{#if this.notes}} ({{this.notes}}){{/if}}
{{/each}}
{{else}}
No sleep history available. Suggest sleep tracking if relevant.
{{/if}}

RESPONSE RULES:
1. **Simple Greetings**: Respond with 1-2 sentences + 2-3 follow-up questions
2. **Sleep Questions**: Use structured format with:
   - Brief empathetic acknowledgment
   - ## 🧠 **Main Topic** headings for key areas
   - * Bullet points for actionable advice
   - Personalized recommendations when profile data available
3. **Language**: If user writes in Arabic, respond in fluent Arabic
4. **Tone**: Warm, supportive, and encouraging - like a knowledgeable friend
5. **Follow-ups**: Always include 2-4 relevant follow-up questions

Remember: Quality over quantity. Better to give focused, actionable advice than overwhelming information.`,
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
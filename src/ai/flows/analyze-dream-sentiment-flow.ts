
'use server';
/**
 * @fileOverview An AI flow to analyze the sentiment of dream descriptions.
 *
 * - analyzeDreamSentiment - A function that analyzes dream text.
 * - AnalyzeDreamSentimentInput - The input type for the analyzeDreamSentiment function.
 * - AnalyzeDreamSentimentOutput - The return type for the analyzeDreamSentiment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeDreamSentimentInputSchema = z.object({
  dreamText: z.string().describe('The text content of the dream to be analyzed.'),
});
export type AnalyzeDreamSentimentInput = z.infer<typeof AnalyzeDreamSentimentInputSchema>;

const AnalyzeDreamSentimentOutputSchema = z.object({
  primarySentiment: z.string().describe("The dominant emotional tone of the dream (e.g., Joyful, Fearful, Anxious, Peaceful, Confusing, Bizarre, Mundane, Exciting, Sad, Reflective). Choose one or two primary descriptors if appropriate, separated by a comma if two are chosen."),
  briefAnalysis: z.string().describe("A very brief (1-2 sentence) interpretation or observation about the dream's emotional tone, highlighting key elements that support this sentiment."),
});
export type AnalyzeDreamSentimentOutput = z.infer<typeof AnalyzeDreamSentimentOutputSchema>;

export async function analyzeDreamSentiment(input: AnalyzeDreamSentimentInput): Promise<AnalyzeDreamSentimentOutput> {
  return analyzeDreamSentimentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeDreamSentimentPrompt',
  input: {schema: AnalyzeDreamSentimentInputSchema},
  output: {schema: AnalyzeDreamSentimentOutputSchema},
  prompt: `You are an expert dream analyst AI. Your task is to analyze the sentiment of the following dream description.

Dream Description:
"{{{dreamText}}}"

Based on the dream, determine its primary emotional tone. This could be feelings like joyful, fearful, anxious, peaceful, confusing, bizarre, mundane, exciting, sad, reflective, etc. If there are multiple prominent emotions, you can list up to two, separated by a comma.

Also, provide a very brief (1-2 sentences maximum) analysis or observation that explains why you've identified that sentiment, perhaps pointing to key symbols or events in the dream that support your conclusion.

Focus on the emotional content and overall feeling conveyed by the dream.
`,
});

const analyzeDreamSentimentFlow = ai.defineFlow(
  {
    name: 'analyzeDreamSentimentFlow',
    inputSchema: AnalyzeDreamSentimentInputSchema,
    outputSchema: AnalyzeDreamSentimentOutputSchema,
  },
  async (input: AnalyzeDreamSentimentInput) => {
    const {output} = await prompt(input);
    if (!output) {
        return { 
            primarySentiment: "Uncertain", 
            briefAnalysis: "Could not determine sentiment from the provided text." 
        };
    }
    return output;
  }
);

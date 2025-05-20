
'use server';
/**
 * @fileOverview An AI flow to analyze the sentiment and provide a detailed interpretation of dream descriptions.
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
  detailedAnalysis: z.string().describe("A detailed and comprehensive (multiple sentences, potentially a short paragraph) interpretation of the dream's emotional tone, key symbols, themes, and potential meanings. Explore underlying feelings and connections if possible."),
});
export type AnalyzeDreamSentimentOutput = z.infer<typeof AnalyzeDreamSentimentOutputSchema>;

export async function analyzeDreamSentiment(input: AnalyzeDreamSentimentInput): Promise<AnalyzeDreamSentimentOutput> {
  return analyzeDreamSentimentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeDreamSentimentPrompt',
  input: {schema: AnalyzeDreamSentimentInputSchema},
  output: {schema: AnalyzeDreamSentimentOutputSchema},
  prompt: `You are an expert dream analyst and interpreter AI. Your task is to analyze the sentiment and provide a detailed interpretation of the following dream description.

Dream Description:
"{{{dreamText}}}"

1.  **Primary Sentiment**: Determine the dream's primary emotional tone. This could be feelings like joyful, fearful, anxious, peaceful, confusing, bizarre, mundane, exciting, sad, reflective, etc. If there are multiple prominent emotions, you can list up to two, separated by a comma.

2.  **Detailed Analysis**: Provide a comprehensive interpretation of the dream. This should be more than just a brief summary. Elaborate on:
    *   Key symbols or objects present in the dream and their potential common interpretations.
    *   Recurring themes or patterns if evident.
    *   The emotional undercurrents and how they develop or shift throughout the dream.
    *   Possible connections to waking life concerns, stressors, or desires, if the dream content suggests such links (be cautious and phrase these as possibilities).
    *   The overall narrative or message the dream might be conveying.
    Aim for an insightful and thoughtful analysis that helps the user understand their dream on a deeper level. Write at least 3-5 sentences, or a short paragraph, for this detailed analysis.

Focus on providing a supportive, non-judgmental, and exploratory interpretation.
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
            detailedAnalysis: "Could not determine sentiment or provide a detailed analysis from the provided text." 
        };
    }
    // Ensure the field name matches the updated schema
    return {
        primarySentiment: output.primarySentiment,
        detailedAnalysis: output.detailedAnalysis // Ensure this is the correct field from the prompt output
    };
  }
);


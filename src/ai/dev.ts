
import { config } from 'dotenv';
config();

import '@/ai/flows/chat-based-sleep-assistant.ts';
import '@/ai/flows/ai-sleep-coach.ts';
import '@/ai/flows/analyze-dream-sentiment-flow.ts'; // Added import for the new Dream Sentiment flow


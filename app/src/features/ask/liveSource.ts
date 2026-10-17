// The real stylist on a DEV build (07 C2, check A7): a dev key, like the reading call (services/readingSource/
// live.ts). On since Oct 17 (#310). Since Oct 17 (#329, the founder: "going with the OpenAI model is probably the
// better idea") the answers come from OpenAI's GPT-5.6 Luna, the only model that passed every gate in the model test
// (#311; 83% good answers vs Flash-Lite's 54%, 0.035¢ a question). Gemini stays one switch away. There's no silent
// fallback from one to the other: consent names OpenAI for questions, so a missing OpenAI key means no live answers,
// never a question sent to Google instead. Release builds never have a key (__DEV__ is false there), so they can't
// pick either; outside testers need the server route (C6, handoff/13-server.md).
import { fetch as expoFetch } from 'expo/fetch';
import { Platform } from 'react-native';
import { ASK_MAX_TOKENS, createAskGemini, type AskGeminiOptions } from './gemini';
import { createAskOpenAI } from './providers';
import type { AnswerSource } from './source';

/** The switch for real answers (on, #310; dev builds with a dev key only). */
export const CHAT_LIVE = true;

export type ChatProvider = 'openai' | 'gemini';
/** Who answers his questions (#329). Changing it also changes what consent must say (onb.consent.sent3). */
export const CHAT_PROVIDER: ChatProvider = 'openai';
/** The model test's winner (#311). Reasoning "none", the app's answer cap. */
export const CHAT_OPENAI_MODEL = 'gpt-5.6-luna';

const DEV_KEYS: Record<ChatProvider, string | undefined> = {
  gemini: __DEV__ ? process.env.EXPO_PUBLIC_GEMINI_DEV_KEY : undefined,
  openai: __DEV__ ? process.env.EXPO_PUBLIC_OPENAI_DEV_KEY : undefined,
};

// expo/fetch streams on the phone; in the web preview it throws before sending, so the browser's own fetch (#310).
const streamFetch = () => (Platform.OS === 'web' ? globalThis.fetch.bind(globalThis) : expoFetch) as unknown as AskGeminiOptions['fetch'];

/** The real source, or null when it may not be used (switched off, or no key for the chosen provider). */
export function liveAnswerSource(on: boolean = CHAT_LIVE, provider: ChatProvider = CHAT_PROVIDER, key: string | undefined = DEV_KEYS[provider]): AnswerSource | null {
  if (!on || !key) return null;
  if (provider === 'openai') {
    return createAskOpenAI({
      apiKey: key, fetch: streamFetch(), model: CHAT_OPENAI_MODEL, effort: 'none', maxTokens: ASK_MAX_TOKENS,
      onCall: (c) => console.log(`[ask] openai ${c.ms} ms · ${c.model ?? '?'} · in ${c.usage.in} (${c.usage.cached} cached) / out ${c.usage.out} tokens${c.stop && c.stop !== 'stop' ? ` · ${c.stop}` : ''}`),
    });
  }
  return createAskGemini({
    apiKey: key,
    fetch: streamFetch(),
    onCall: (c) => console.log(`[ask] gemini ${c.ms} ms · ${c.model ?? '?'} · in ${c.usage?.promptTokenCount ?? '?'} / out ${c.usage?.candidatesTokenCount ?? '?'} tokens${c.finishReason && c.finishReason !== 'STOP' ? ` · ${c.finishReason}` : ''}`),
  });
}

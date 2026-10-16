// The real stylist on a DEV build (07 C2, check A7): the dev key, like the reading call (services/readingSource/
// live.ts). Off until the founder OKs the ~$0.50 of live tries: CHAT_LIVE stays false, so his phone keeps
// "Questions are coming soon". Release builds never have the key (__DEV__ is false there), so they can't pick it.
import { fetch as expoFetch } from 'expo/fetch';
import { createAskGemini, type AskGeminiOptions } from './gemini';
import type { AnswerSource } from './source';

/** The switch for real answers (needs his OK on the live tries, CLAUDE.md to-do). */
export const CHAT_LIVE = false;

const KEY: string | undefined = __DEV__ ? process.env.EXPO_PUBLIC_GEMINI_DEV_KEY : undefined;

/** The real source, or null when it may not be used (switched off, or no key). */
export function liveAnswerSource(on: boolean = CHAT_LIVE, key: string | undefined = KEY): AnswerSource | null {
  if (!on || !key) return null;
  return createAskGemini({
    apiKey: key,
    fetch: expoFetch as unknown as AskGeminiOptions['fetch'],
    onCall: (c) => console.log(`[ask] gemini ${c.ms} ms · ${c.model ?? '?'} · in ${c.usage?.promptTokenCount ?? '?'} / out ${c.usage?.candidatesTokenCount ?? '?'} tokens${c.finishReason && c.finishReason !== 'STOP' ? ` · ${c.finishReason}` : ''}`),
  });
}

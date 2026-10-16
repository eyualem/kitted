// The real stylist on a DEV build (07 C2, check A7): the dev key, like the reading call (services/readingSource/
// live.ts). On since Oct 17 (#310, the founder's OK on the live tries: "switch CHAT_LIVE on"): his dev build answers
// for real through Metro. Release builds never have the key (__DEV__ is false there), so they can't pick it; outside
// testers need the server route (C6).
import { fetch as expoFetch } from 'expo/fetch';
import { Platform } from 'react-native';
import { createAskGemini, type AskGeminiOptions } from './gemini';
import type { AnswerSource } from './source';

/** The switch for real answers (on, #310; dev builds with the dev key only). */
export const CHAT_LIVE = true;

const KEY: string | undefined = __DEV__ ? process.env.EXPO_PUBLIC_GEMINI_DEV_KEY : undefined;

/** The real source, or null when it may not be used (switched off, or no key). */
export function liveAnswerSource(on: boolean = CHAT_LIVE, key: string | undefined = KEY): AnswerSource | null {
  if (!on || !key) return null;
  return createAskGemini({
    apiKey: key,
    // expo/fetch streams on the phone; in the web preview it throws before sending, so the browser's own fetch (#310).
    fetch: (Platform.OS === 'web' ? globalThis.fetch.bind(globalThis) : expoFetch) as unknown as AskGeminiOptions['fetch'],
    onCall: (c) => console.log(`[ask] gemini ${c.ms} ms · ${c.model ?? '?'} · in ${c.usage?.promptTokenCount ?? '?'} / out ${c.usage?.candidatesTokenCount ?? '?'} tokens${c.finishReason && c.finishReason !== 'STOP' ? ` · ${c.finishReason}` : ''}`),
  });
}

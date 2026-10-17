// The real stylist (07 C2, check A7). Two ways, by who answers (CHAT_PROVIDER):
//   openai (since Oct 17, #329, the founder: "going with the OpenAI model is probably the better idea"): GPT-5.6 Luna,
//          the only model past every gate in the model test (#311; 83% good answers vs Flash-Lite's 54%, 0.035¢ a
//          question), straight to OpenAI with the dev key on a dev build. The server's /v1/ask doesn't take OpenAI
//          yet (13-server.md §8), so a Release build has no live answers until it does. No silent fallback: consent
//          (version 2) names OpenAI for questions, so a question is never quietly sent to Google instead.
//   gemini: sent the way the reading call is (services/server, 13-server.md §8): the dev key on a dev build (#310),
//          our server's /v1/ask on a Release build or with EXPO_PUBLIC_KITTED_SERVER (#328).
import { fetch as expoFetch } from 'expo/fetch';
import { Platform } from 'react-native';
import { aiTransport } from '@/services/server';
import type { AiTransport } from '@/services/server/transport';
import { ASK_MAX_TOKENS, createAskGemini } from './gemini';
import { createAskOpenAI, type ProviderOptions } from './providers';
import type { AnswerSource } from './source';

/** The switch for real answers (on, #310). */
export const CHAT_LIVE = true;

export type ChatProvider = 'openai' | 'gemini';
/** Who answers his questions (#329). Changing it also changes what consent must say (onb.consent.sent3). */
export const CHAT_PROVIDER: ChatProvider = 'openai';
/** The model test's winner (#311). Reasoning "none", the app's answer cap. */
export const CHAT_OPENAI_MODEL = 'gpt-5.6-luna';

/** Dev builds only (__DEV__ is false in Release, and guard:release keeps keys out of the bundle). */
const DEV_OPENAI_KEY: string | undefined = __DEV__ ? process.env.EXPO_PUBLIC_OPENAI_DEV_KEY || undefined : undefined;

// expo/fetch streams on the phone. The web preview can't call OpenAI at all (the browser blocks it, CORS, #329).
const streamFetch = () => (Platform.OS === 'web' ? globalThis.fetch.bind(globalThis) : expoFetch) as unknown as ProviderOptions['fetch'];

/** The real source, or null when it may not be used (switched off, or nowhere to send for the chosen provider). */
export function liveAnswerSource(
  on: boolean = CHAT_LIVE,
  transport: AiTransport | null = aiTransport(),
  provider: ChatProvider = CHAT_PROVIDER,
  openaiKey: string | undefined = DEV_OPENAI_KEY,
): AnswerSource | null {
  if (!on) return null;
  if (provider === 'openai') {
    if (!openaiKey) return null;
    return createAskOpenAI({
      apiKey: openaiKey, fetch: streamFetch(), model: CHAT_OPENAI_MODEL, effort: 'none', maxTokens: ASK_MAX_TOKENS,
      onCall: (c) => console.log(`[ask] openai ${c.ms} ms · ${c.model ?? '?'} · in ${c.usage.in} (${c.usage.cached} cached) / out ${c.usage.out} tokens${c.stop && c.stop !== 'stop' ? ` · ${c.stop}` : ''}`),
    });
  }
  if (!transport) return null;
  return createAskGemini({
    transport,
    onCall: (c) => console.log(`[ask] gemini ${c.ms} ms · ${c.model ?? '?'} · in ${c.usage?.promptTokenCount ?? '?'} / out ${c.usage?.candidatesTokenCount ?? '?'} tokens${c.finishReason && c.finishReason !== 'STOP' ? ` · ${c.finishReason}` : ''}`),
  });
}

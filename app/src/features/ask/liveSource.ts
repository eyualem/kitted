// The real stylist (07 C2, check A7), sent the way the reading call is (services/server, 13-server.md §8): the dev key
// on a dev build (on since Oct 17, #310: his dev build answers for real through Metro), our server's /v1/ask on a
// Release build (C6, #327).
import { aiTransport } from '@/services/server';
import type { AiTransport } from '@/services/server/transport';
import { createAskGemini } from './gemini';
import type { AnswerSource } from './source';

/** The switch for real answers (on, #310). */
export const CHAT_LIVE = true;

/** The real source, or null when it may not be used (switched off, or nowhere to send: a dev build with no key). */
export function liveAnswerSource(on: boolean = CHAT_LIVE, transport: AiTransport | null = aiTransport()): AnswerSource | null {
  if (!on || !transport) return null;
  return createAskGemini({
    transport,
    onCall: (c) => console.log(`[ask] gemini ${c.ms} ms · ${c.model ?? '?'} · in ${c.usage?.promptTokenCount ?? '?'} / out ${c.usage?.candidatesTokenCount ?? '?'} tokens${c.finishReason && c.finishReason !== 'STOP' ? ` · ${c.finishReason}` : ''}`),
  });
}

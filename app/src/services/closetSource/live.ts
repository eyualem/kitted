// Which closet source answers, routed exactly like the scoring read (readingSource/live.ts, decision #41): bundled
// demo photos replay their bundled closet answers; a real photo goes to Gemini (through our server on a Release build,
// with the dev key on a dev build, 13-server.md §8) and only with his consent (the same "Send to Google" gate as the
// reading). The upload is the same face-hidden
// 1024 px copy the scoring call sent (kept on the phone; reloaded by its hash for a later catch-up).
import { reloadUpload } from '../../../modules/kitted-vision';
import { aiTransport } from '../server';
import type { AiTransport } from '../server/transport';
import { createClosetGeminiSource } from './gemini';
import type { ClosetSource } from './types';

export function routedClosetSource(mock: ClosetSource, consent: () => Promise<boolean>, transport: AiTransport | null = aiTransport()): ClosetSource {
  const live = transport
    ? createClosetGeminiSource({
        transport,
        onCall: (c) => console.log(`[closet] ${c.seconds.toFixed(1)} s · in ${c.usage?.promptTokenCount ?? '?'} / out ${c.usage?.candidatesTokenCount ?? '?'} tokens${c.attempts > 1 ? ' · retried' : ''}${c.fail ? ` · failed ${c.fail}` : ''}`),
      })
    : null;
  return {
    async read(image, stubs, kind, opts) {
      if (image.photoId || !live) return mock.read(image, stubs, kind, opts);
      if (!(await consent())) return { fail: 'noConsent' };
      const uploadBase64 = image.uploadBase64 ?? (await reloadUpload(image.sha256));
      if (!uploadBase64) return { fail: 'noUpload' };
      return live.read({ ...image, uploadBase64 }, stubs, kind, opts);
    },
  };
}

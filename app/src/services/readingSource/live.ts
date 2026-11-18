// Which reading source answers: bundled demo photos always replay their saved readings (no
// network, the demo screens stay free and repeatable); a real photo goes to Gemini: through our server on a Release
// build, with the dev key on a dev build (decision #41, 13-server.md §8). A dev build with neither: "This demo only
// knows its sample photos."
import { aiTransport, DIRECT_AI } from '../server';
import { checkTag, type AiTransport } from '../server/transport';
import { createGeminiSource, SEND_CLOSE_UPS } from './gemini';
import { createLookGemini, lookImages, lookLogLine } from './secondLook';
import type { ReadingSource } from './types';

/** The dev key's direct path (the founder's phone): the daily limit doesn't apply while testing readings. */
export const LIVE_READING = DIRECT_AI;

/** `consent`: whether a photo may leave the phone (onboarded without consent = never, 02 D4). Without it a real
 *  photo never reaches Gemini; the mock answers instead (it knows only the bundled photos). */
export function routedSource(
  mock: ReadingSource, consent: () => Promise<boolean> = async () => true, transport: AiTransport | null = aiTransport(),
): ReadingSource {
  const live = transport
    ? createGeminiSource({
        transport,
        onCall: (c) => console.log(`[gemini] ${c.seconds.toFixed(1)} s · ${c.model} · in ${c.usage?.promptTokenCount ?? '?'} / out ${c.usage?.candidatesTokenCount ?? '?'} tokens${c.hedged ? ' · hedged' : ''}`),
      })
    : null;
  // The second look (#199): the same way, the same consent, only when the read itself goes to Gemini.
  const look = transport ? createLookGemini({ transport, onCall: (arm, r) => console.log(lookLogLine(arm, r)) }) : null;
  return {
    secondLook(image, kind, opts) {
      if (kind !== 'full' && kind !== 'recheck') return null;
      if (image.photoId || !look || !image.uploadBase64 || !SEND_CLOSE_UPS) return mock.secondLook?.(image, kind, opts) ?? null;
      const imgs = lookImages(image.zoomBase64);
      if (!imgs) return null;
      const gate = consent().catch(() => false);
      const refused = { ok: false as const, fail: 'noConsent' as const, ms: 0 };
      // Both arms ride on the check's own id (13 §3): free once its read is in.
      const tag = opts?.checkId ? checkTag(opts.checkId, kind) : undefined;
      return {
        u: gate.then((ok) => (ok ? look.arm('U', imgs.U, opts?.signal, tag) : refused)),
        l: gate.then((ok) => (ok ? look.arm('L', imgs.L, opts?.signal, tag) : refused)),
      };
    },
    legLook(image, kind, opts) {
      if (kind !== 'full' && kind !== 'recheck') return null;
      if (image.photoId || !look || !image.uploadBase64 || !SEND_CLOSE_UPS) return mock.legLook?.(image, kind, opts) ?? null;
      const imgs = lookImages(image.zoomBase64);
      if (!imgs) return null;
      const tag = opts?.checkId ? checkTag(opts.checkId, kind) : undefined;
      // The same consent as U and L; only the lower close-up L already sends (T69).
      return consent().catch(() => false).then((ok) => (ok ? look.arm('W', imgs.W, opts?.signal, tag) : { ok: false as const, fail: 'noConsent' as const, ms: 0 }));
    },
    hedge: () => {
      mock.hedge?.();
      live?.hedge?.();
    },
    async *read(image, kind, opts) {
      const useLive = !image.photoId && !!live && !!image.uploadBase64 && (await consent());
      yield* useLive ? live!.read(image, kind, opts) : mock.read(image, kind, opts);
    },
  };
}

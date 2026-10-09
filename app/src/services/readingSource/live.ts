// Which reading source answers: bundled demo photos always replay their saved readings (no
// network, the demo screens stay free and repeatable); a real photo goes to Gemini only in a
// DEV build that has the key (decision #41). Otherwise "This demo only knows its sample photos."
import { fetch as expoFetch } from 'expo/fetch';
import { createGeminiSource, type GeminiOptions } from './gemini';
import type { ReadingSource } from './types';

/** `undefined` in Release: `__DEV__` is false there, so the minifier drops the key string. */
const KEY: string | undefined = __DEV__ ? process.env.EXPO_PUBLIC_GEMINI_DEV_KEY : undefined;
export const LIVE_READING = !!KEY;

/** `consent`: whether a photo may leave the phone (onboarded without consent = never, 02 D4). Without it a real
 *  photo never reaches Gemini; the mock answers instead (it knows only the bundled photos). */
export function routedSource(mock: ReadingSource, consent: () => Promise<boolean> = async () => true): ReadingSource {
  const live = KEY
    ? createGeminiSource({
        apiKey: KEY,
        fetch: expoFetch as unknown as GeminiOptions['fetch'],
        onCall: (c) => console.log(`[gemini] ${c.seconds.toFixed(1)} s · ${c.model} · in ${c.usage?.promptTokenCount ?? '?'} / out ${c.usage?.candidatesTokenCount ?? '?'} tokens${c.hedged ? ' · hedged' : ''}`),
      })
    : null;
  return {
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

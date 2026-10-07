// fonts.ts — bundling and loading Archivo with expo-font (03 §3.4).
//
// WHY STATIC FILES: React Native on the current stable line (Expo SDK 57 = RN 0.86; RN 0.87)
// has no way to set variable-font axes: `fontVariationSettings` is not in the 0.87 Text style
// docs and only landed in RN main on Aug 10 2026 (PR #57815), which ships in RN 0.88
// (rc.3 on Sep 28 2026) / Expo SDK 58 (beta). So we bundle three static Archivo cuts. When the
// app is on SDK 58+, you MAY switch to the variable file with
// `fontVariationSettings: { wdth: 70, wght: 640 }` — test it on device first; static stays the default.
//
// FILES (from the upstream repo, Omnibus-Type/Archivo, folder fonts/ttf/; ~185 KB each):
//   ArchivoCondensed-SemiBold.ttf  wdth 75, wght 600  → score + stat numerals, camera countdown
//   ArchivoCondensed-Medium.ttf    wdth 75, wght 500  → re-check "was" numeral
//   ArchivoExpanded-Bold.ttf       wdth 125, wght 700 → wordmark + avatar "K"
// Download URLs (ask the founder before downloading: 05-build-plan.md §4.7 and §9 item 4):
//   https://raw.githubusercontent.com/Omnibus-Type/Archivo/master/fonts/ttf/ArchivoCondensed-SemiBold.ttf
//   https://raw.githubusercontent.com/Omnibus-Type/Archivo/master/fonts/ttf/ArchivoCondensed-Medium.ttf
//   https://raw.githubusercontent.com/Omnibus-Type/Archivo/master/fonts/ttf/ArchivoExpanded-Bold.ttf
//   License: https://raw.githubusercontent.com/Omnibus-Type/Archivo/master/OFL.txt  (SIL OFL 1.1)
// The google/fonts repo (ofl/archivo/) has ONLY the variable files `Archivo[wdth,wght].ttf` and
// `Archivo-Italic[wdth,wght].ttf`, no statics.
// Width values of the named cuts come from the upstream source's axis mapping
// (ExtraCondensed 62, Condensed 75, SemiCondensed 87.5, SemiExpanded 112.5, Expanded 125).
// Width 75 is the nearest named cut to the mockup's 70 (ExtraCondensed 62 is further away).
// For the exact 70/640 look, cut a static instance from the variable file with fontTools
// (03 §3.4 "Exact instances"); keep the same PostScript name scheme or update typography.ts.
//
// Put the files in <app>/assets/fonts/ and ship OFL.txt (You › Settings › About › Acknowledgements).
//
// RECOMMENDED: embed at build time with the expo-font config plugin (app.json / app.config.ts):
//
//   "plugins": [
//     ["expo-font", {
//       "fonts": [
//         "./assets/fonts/ArchivoCondensed-SemiBold.ttf",
//         "./assets/fonts/ArchivoCondensed-Medium.ttf",
//         "./assets/fonts/ArchivoExpanded-Bold.ttf"
//       ]
//     }]
//   ]
//
// Then run `npx expo prebuild` / a new dev build. Embedded fonts are available at launch with
// no hook, and on iOS "the font family name is always taken directly from the font file"
// (Expo docs), i.e. its PostScript/family name — hence the names in typography.ts → archivo.
// useKittedFonts() below is only needed in Expo Go or if you skip the plugin.

import { getLoadedFonts, useFonts } from 'expo-font';
import { archivo } from './typography';
import { archivoFontFiles } from './fontFiles';

/**
 * Runtime loading (Expo Go / no config plugin). The map KEYS become the fontFamily names, so
 * they're set to the same strings as the embedded PostScript names: both paths then agree.
 * Paths assume this folder lives at <app>/src/design-system/ and fonts at <app>/assets/fonts/.
 */
export function useKittedFonts(): [loaded: boolean, error: Error | null] {
  return useFonts(archivoFontFiles);
}

let cached: boolean | undefined;

/**
 * True when all three Archivo faces are registered (embedded or loaded). Cached after the first
 * `true`. Typography falls back to SF condensed / SF bold while this is false.
 * Debug once: console.log(getLoadedFonts()) and check the three names appear exactly.
 */
export function isArchivoLoaded(): boolean {
  if (cached) return true;
  try {
    const loaded = new Set(getLoadedFonts());
    const ok = Object.values(archivo).every((name) => loaded.has(name));
    if (ok) cached = true;
    return ok;
  } catch {
    return false;
  }
}

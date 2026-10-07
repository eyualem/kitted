// The Archivo font files for runtime loading (web preview, Expo Go). Kept apart from fonts.ts
// because Metro fails the whole bundle on a require() of a missing file.
//
// EMPTY until the founder approves the download (05 §9 item 4). Then add the three files to
// app/assets/fonts/ and replace the map with:
//   [archivo.score]: require('../../assets/fonts/ArchivoCondensed-SemiBold.ttf'),
//   [archivo.scoreLight]: require('../../assets/fonts/ArchivoCondensed-Medium.ttf'),
//   [archivo.wordmark]: require('../../assets/fonts/ArchivoExpanded-Bold.ttf'),
// and uncomment the expo-font plugin in app.config.ts. Until then typography falls back to
// SF Pro condensed / bold (03 §3.4 "Fallback").

import type { FontSource } from 'expo-font';

export const archivoFontFiles: Record<string, FontSource> = {};

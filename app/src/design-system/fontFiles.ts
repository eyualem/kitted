// The Archivo font files for runtime loading (web preview, Expo Go). Kept apart from fonts.ts
// because Metro fails the whole bundle on a require() of a missing file. Native builds embed the
// same files through the expo-font plugin in app.config.ts (founder OK, Oct 12).

import type { FontSource } from 'expo-font';
import { archivo } from './typography';

export const archivoFontFiles: Record<string, FontSource> = {
  [archivo.score]: require('../../assets/fonts/ArchivoCondensed-SemiBold.ttf'),
  [archivo.scoreLight]: require('../../assets/fonts/ArchivoCondensed-Medium.ttf'),
  [archivo.wordmark]: require('../../assets/fonts/ArchivoExpanded-Bold.ttf'),
};

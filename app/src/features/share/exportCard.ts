// S12 · turning the card into an image, then sharing or saving it (02 D20, 05 S13; #344). The card is captured from
// its full-size view at 1080 px wide (react-native-view-shot), then handed to the system share sheet (expo-sharing)
// or added to Photos (expo-media-library, add-only: Kitted never reads his library). The screen says how it went (the
// app's toasts draw under a full-screen cover); nothing is sent anywhere but where he picks in the share sheet.
import type { RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library/legacy';
import { FORMAT_SIZE, type ShareFormat } from './shareModel';

export type ExportResult = 'shared' | 'saved' | 'denied' | 'failed' | 'cancelled';

/** The card as a PNG file at its export size (1080 × 1920, or 1080 × 1350 for the DM card). */
export async function captureCard(ref: RefObject<View | null>, format: ShareFormat): Promise<string> {
  const { px } = FORMAT_SIZE[format];
  return captureRef(ref, { format: 'png', width: px.w, height: px.h, result: 'tmpfile' });
}

export async function shareCard(ref: RefObject<View | null>, format: ShareFormat): Promise<ExportResult> {
  let uri: string;
  try {
    uri = await captureCard(ref, format);
  } catch (e) {
    console.warn('[share] capture failed', e);
    return 'failed';
  }
  try {
    if (!(await Sharing.isAvailableAsync())) return 'failed';
    await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png' });
    return 'shared';
  } catch (e) {
    // Closing the share sheet without picking is not an error worth a line.
    console.warn('[share] share sheet', e);
    return 'cancelled';
  }
}

export async function saveCard(ref: RefObject<View | null>, format: ShareFormat): Promise<ExportResult> {
  try {
    const perm = await MediaLibrary.requestPermissionsAsync(true);
    if (!perm.granted) return 'denied';
    const uri = await captureCard(ref, format);
    await MediaLibrary.saveToLibraryAsync(uri);
    return 'saved';
  } catch (e) {
    console.warn('[share] save failed', e);
    return 'failed';
  }
}

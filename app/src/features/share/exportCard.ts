// S12 · turning the card into an image, then sharing or saving it (02 D20, 05 S13, handoff/14-share-card.md; #349). The
// card is captured from its full-size view (react-native-view-shot), handed to the system share sheet (expo-sharing)
// or added to Photos (expo-media-library, add-only: Kitted never reads his library). The screen says how it went (the
// app's toasts draw under a full-screen cover); nothing is sent anywhere but where he picks in the share sheet.
//
// Two facts from the native code (14 §2, read Oct 18):
// - view-shot's `width`/`height` are points, drawn at the device's scale; so the export width in px is divided by the
//   pixel ratio (1080 px = 360 pt on a 3× iPhone), or the image would come out 3× too big.
// - expo-media-library's legacy saveToLibraryAsync re-encodes through UIImage (UIImageWriteToSavedPhotosAlbum), which
//   can drop the transparency; Asset.create adds the PNG file itself, with add-only access.
import type { RefObject } from 'react';
import { PixelRatio, type View } from 'react-native';
import { captureRef, releaseCapture } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Asset, requestPermissionsAsync } from 'expo-media-library';
import { FORMAT_SIZE, type ShareFormat } from './shareModel';

export type ExportResult = 'shared' | 'saved' | 'denied' | 'failed' | 'cancelled';

/** How long a captured file is kept after the share sheet closes, in case a share extension is still copying it. */
const RELEASE_AFTER_MS = 30_000;

/** The card as a PNG file at its export size (1080 × 600 or 1080 × 1920 px). */
export async function captureCard(ref: RefObject<View | null>, format: ShareFormat): Promise<string> {
  const { px } = FORMAT_SIZE[format];
  const r = PixelRatio.get();
  return captureRef(ref, { format: 'png', width: px.w / r, height: px.h / r, result: 'tmpfile' });
}

/** Deletes a captured file (view-shot's own release, which only touches its temp folder). */
function release(uri: string, afterMs = 0) {
  const go = () => {
    try {
      releaseCapture(uri);
    } catch {
      // A file already gone is fine.
    }
  };
  if (afterMs > 0) setTimeout(go, afterMs);
  else go();
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
  } finally {
    release(uri, RELEASE_AFTER_MS);
  }
}

export async function saveCard(ref: RefObject<View | null>, format: ShareFormat): Promise<ExportResult> {
  let uri: string | null = null;
  try {
    const perm = await requestPermissionsAsync(true);
    if (!perm.granted) return 'denied';
    uri = await captureCard(ref, format);
    await Asset.create(uri);
    return 'saved';
  } catch (e) {
    console.warn('[share] save failed', e);
    return 'failed';
  } finally {
    if (uri) release(uri);
  }
}

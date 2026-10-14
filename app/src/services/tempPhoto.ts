// His temporary original (the picker's or the camera's file) when it will never be prepped ("Which one is you?"
// cancelled or replaced): deleted, like photo prep deletes it once it's used. Only files in the app's temporary or
// Caches folders; never anything under Documents (his kept photos).
import { File } from 'expo-file-system';

export function isTemporaryPhoto(uri: string): boolean {
  return !uri.includes('/Documents/') && (uri.includes('/tmp/') || uri.includes('/Caches/'));
}

export function discardTempPhoto(uri: string): void {
  if (!isTemporaryPhoto(uri)) return;
  try {
    new File(uri).delete();
  } catch {
    // already gone
  }
}

// The photo folders on this iPhone (Y7 · Privacy & data): what "Photos on this iPhone" counts, what
// "Delete all photos" removes, and where "See what I send" finds the last face-blurred upload copy.
// Every path here is written by photo prep (modules/kitted-vision/ios/KittedPrep.swift) or the measurer:
//   Documents/photos   his kept photos as taken (no blur) + thumbs          <sha>-photo.jpg, <sha>-thumb.jpg
//   Documents/scans    clothes scans (kept, thumb, the face-hidden send copy) <sha>-photo.jpg …
//   Documents/closet   closet cut-outs and their fingerprints               <sha>-<key>.png / .print
//   Caches/detail      face-hidden 2048 px copies (a week; closet crops)
//   Caches/upload      the face-blurred upload copies and close-ups          <sha>.jpg, <sha>-upper.jpg …
//   Caches/ImagePicker library picks not yet prepped; tmp/kitted-capture-*  camera shots not yet prepped
// Documents/logs (DEV guide log) goes only with "Delete all my data". The web preview has none of these.
import { Directory, File, Paths } from 'expo-file-system';

export interface PhotoUsage {
  /** His photos: kept fit-check photos and clothes scans. */
  photos: number;
  /** Every byte "Delete all photos" frees (kept photos, thumbs, cut-outs, face-hidden copies). */
  bytes: number;
}

/** The last copy that left (or was made to leave) the phone: the main upload and its close-ups. */
export interface SentCopy {
  uri: string;
  closeUps: string[];
  /** When it was written (prep time, ms since the epoch). */
  at: number | null;
}

/** The file system side of the privacy screen, behind an interface so the wipe can be tested on the memory store. */
export interface PrivacyFiles {
  usage(): PhotoUsage;
  lastSent(): SentCopy | null;
  /** Deletes every photo folder above (never the database). */
  deletePhotos(): void;
  /** Deletes Documents/logs (delete-all only). */
  deleteLogs(): void;
}

type Root = 'document' | 'cache';
const PHOTO_DIRS: [Root, string][] = [
  ['document', 'photos'],
  ['document', 'scans'],
  ['document', 'closet'],
  ['cache', 'detail'],
  ['cache', 'upload'],
  ['cache', 'ImagePicker'],
];
const KEPT_DIRS = ['photos', 'scans'];
const MAIN_UPLOAD = /^[0-9a-f]{16,}\.jpg$/;
const CLOSE_UP_KINDS = ['upper', 'lower', 'body'];

function dir(root: Root, name: string): Directory | null {
  try {
    return new Directory(root === 'document' ? Paths.document : Paths.cache, name);
  } catch {
    return null; // web preview: no file system
  }
}

function filesIn(d: Directory | null): File[] {
  if (!d) return [];
  try {
    if (!d.exists) return [];
    const out: File[] = [];
    for (const e of d.list()) {
      if (e instanceof Directory) out.push(...filesIn(e));
      else out.push(e);
    }
    return out;
  } catch {
    return [];
  }
}

function remove(d: Directory | File | null): void {
  try {
    if (d?.exists) d.delete();
  } catch (e: unknown) {
    console.error('[privacy] could not delete', d?.uri, e);
  }
}

/** The app's tmp folder (camera shots before prep). Paths has no tmp, so it's found next to Documents. */
function tmpDir(): Directory | null {
  try {
    const docs = Paths.document.uri;
    const at = docs.lastIndexOf('/Documents');
    return at >= 0 ? new Directory(`${docs.slice(0, at)}/tmp/`) : null;
  } catch {
    return null;
  }
}

export const realPrivacyFiles: PrivacyFiles = {
  usage() {
    let photos = 0;
    let bytes = 0;
    for (const [root, name] of PHOTO_DIRS) {
      for (const f of filesIn(dir(root, name))) {
        bytes += f.size ?? 0;
        if (root === 'document' && KEPT_DIRS.includes(name) && f.name.endsWith('-photo.jpg')) photos += 1;
      }
    }
    return { photos, bytes };
  },
  lastSent() {
    const up = dir('cache', 'upload');
    const mains = filesIn(up).filter((f) => MAIN_UPLOAD.test(f.name));
    if (mains.length === 0 || !up) return null;
    const time = (f: File) => f.lastModified ?? f.modificationTime ?? 0;
    const last = mains.reduce((a, b) => (time(b) > time(a) ? b : a));
    const sha = last.name.slice(0, -'.jpg'.length);
    const closeUps = CLOSE_UP_KINDS.map((k) => new File(up, `${sha}-${k}.jpg`)).filter((f) => f.exists).map((f) => f.uri);
    return { uri: last.uri, closeUps, at: time(last) || null };
  },
  deletePhotos() {
    for (const [root, name] of PHOTO_DIRS) remove(dir(root, name));
    for (const f of filesIn(tmpDir())) if (f.name.startsWith('kitted-capture-')) remove(f);
  },
  deleteLogs() {
    remove(dir('document', 'logs'));
  },
};

/** "42 MB" / "860 KB" / "1.2 GB" (no Intl: Hermes, see CLAUDE.md lessons). */
export function bytesParts(bytes: number): { n: string; unit: 'kb' | 'mb' | 'gb' } {
  const kb = bytes / 1024;
  const mb = kb / 1024;
  const gb = mb / 1024;
  const fmt = (v: number) => (v < 10 ? String(Math.round(v * 10) / 10) : String(Math.round(v)));
  if (gb >= 1) return { n: fmt(gb), unit: 'gb' };
  if (mb >= 1) return { n: fmt(mb), unit: 'mb' };
  return { n: String(Math.max(0, Math.round(kb))), unit: 'kb' };
}

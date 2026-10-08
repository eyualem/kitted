// Kept photos are stored relative to the app's Documents folder ("photos/<sha>-photo.jpg"),
// never as absolute file:// URLs: iOS moves the app's data container on reinstall and update,
// so an absolute path saved last week points nowhere today (DECISIONS-LOG #56).
import { Paths } from 'expo-file-system';

const DOCS = '/Documents/';

/** What the database keeps for a file under Documents; anything else is returned unchanged. */
export function toStoredPath(uri: string | null | undefined): string | null {
  if (!uri) return null;
  const at = uri.indexOf(DOCS);
  return at >= 0 ? decodeURI(uri.slice(at + DOCS.length)) : uri;
}

/** A file:// URL for a stored path. Rows saved before this fix hold absolute URLs: their
 *  Documents part is re-rooted on today's container. */
export function resolveStoredPath(stored: string | null | undefined): string | null {
  if (!stored) return null;
  const at = stored.indexOf(DOCS);
  const rel = stored.startsWith('file://') ? (at >= 0 ? decodeURI(stored.slice(at + DOCS.length)) : null) : stored.includes('://') ? null : stored;
  if (rel === null) return stored;
  const root = documentsUri();
  return root ? root + encodeURI(rel) : stored;
}

function documentsUri(): string | null {
  try {
    const uri = Paths.document.uri;
    return uri.endsWith('/') ? uri : `${uri}/`;
  } catch {
    return null; // web preview: no Documents folder (it only shows bundled photos)
  }
}

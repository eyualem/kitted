// Y7 · Privacy & data (02-screens.md): the three deletes and the consent switch, on the store's own interface so they
// run the same on SQLite, the web preview's memory store and in tests. Everything is local (works offline).
//   - Delete all photos: every photo file goes; scores, readings and the closet stay. Rows lose their photo paths, so
//     the thread hides the bubble and the viewer has nothing to open (the missing-photo state).
//   - Forget what your stylist knows: every fact is deleted for good ("Deleted facts are never used again").
//   - Delete all my data: the database, every file folder and the Keychain device ID. The age block stays (02 Y7,
//     05 S11), so an under-18 answer can't be undone by deleting.
//   - Consent off: the two consent fields are cleared, so every path that sends a photo refuses (mayUpload).
import type { KittedStore } from '@/data/store';
import { KV } from '@/data/store';
import type { ChatMessage } from '@/data/types';
import { liveAnswer } from '@/features/ask/live';
import { INBOX_KEY } from '@/features/scan/inbox';
import type { PrivacyFiles } from './files';

export interface WipeDeps {
  store: KittedStore;
  files: PrivacyFiles;
  /** The Keychain's device ID. The age flag is never touched here. */
  clearDeviceId: () => Promise<void>;
  /** Demo builds load the bundled seed into an empty store at launch; this marker keeps a wiped store empty. */
  demo?: boolean;
}

/** Whether a real photo may leave the phone: a profile that holds his consent. Stricter than onboarding's
 *  hasConsent (which lets a store with no profile through, for the demo's bundled photos): no profile, no upload. */
export async function mayUpload(store: Pick<KittedStore, 'profile'>): Promise<boolean> {
  const p = await store.profile.get('me');
  return !!p && !!p.consentVersion;
}

/** "Score my fits" off: withdraws consent at once. Turning it back on goes through the consent sheet (giveConsent). */
export async function withdrawConsent(store: Pick<KittedStore, 'profile'>): Promise<void> {
  const p = await store.profile.get('me');
  if (p && (p.consentVersion !== null || p.consentAt !== null)) await store.profile.put({ ...p, consentVersion: null, consentAt: null });
}

export interface PhotosDeleted {
  checks: number;
  items: number;
  messages: number;
}

function withoutPhoto(m: ChatMessage): Record<string, unknown> | null {
  const p = m.payload ?? {};
  if (typeof p.photoUri !== 'string' || !p.photoUri) return null;
  const { photoUri: _gone, ...rest } = p;
  return rest;
}

export async function deleteAllPhotos(d: Pick<WipeDeps, 'store' | 'files'>): Promise<PhotosDeleted> {
  const { store } = d;
  d.files.deletePhotos();
  let checks = 0;
  for (const c of await store.fitChecks.all()) {
    if (!c.photoFile && !c.thumbFile) continue;
    // Only the two path fields: closetSummary / itemIds are the closet service's (CLAUDE.md lessons).
    await store.fitChecks.patch(c.id, { photoFile: null, thumbFile: null });
    checks += 1;
  }
  let items = 0;
  for (const it of await store.closet.all()) {
    if (!it.photoFile && !it.cropFile) continue;
    await store.closet.patch(it.id, { photoFile: null, cropFile: null, cropScore: null });
    items += 1;
  }
  for (const o of await store.closetObs.all()) {
    if (o.cropFile) await store.closetObs.patch(o.id, { cropFile: null, cropQuality: null });
  }
  let messages = 0;
  for (const m of await store.chat.all()) {
    // "Which one is you?" waits on its photo, which is gone now: the question goes (nothing was sent or counted).
    if (m.payload?.question === 'whichOne') {
      await store.chat.delete(m.id);
      messages += 1;
      continue;
    }
    const payload = withoutPhoto(m);
    if (payload) {
      await store.chat.patch(m.id, { payload });
      messages += 1;
    }
  }
  await store.deleteKv(INBOX_KEY);
  return { checks, items, messages };
}

/** Every fact goes for good (the You tab and "What your stylist knows" read only what's left). */
export async function forgetFacts(store: Pick<KittedStore, 'facts'>): Promise<number> {
  const all = await store.facts.all();
  for (const f of all) await store.facts.delete(f.id);
  return all.length;
}

/** Everything on this iPhone except the age block. The caller returns him to Welcome (O1). */
export async function deleteAllData(d: WipeDeps): Promise<void> {
  d.files.deletePhotos();
  d.files.deleteLogs();
  await d.store.wipe();
  // An answer held in memory would otherwise draw in the fresh, empty thread (07 §17, U1).
  liveAnswer.clear();
  await d.clearDeviceId();
  if (d.demo) await d.store.setKv(KV.seedLoaded, 'wiped');
}

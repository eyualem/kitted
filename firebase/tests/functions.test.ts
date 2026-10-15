// Server-job checks F1–F3 (handoff/11-firestore-schema.md §9), on the emulator suite (auth, firestore, storage).
// Runs the job bodies directly with the Admin SDK pointed at the emulators (FIRESTORE_EMULATOR_HOST etc., set by
// `firebase emulators:exec`). Written before the jobs were installable; first run waits for the founder's OK.
import { describe, it } from 'vitest';

describe('F1 deleteAccount', () => {
  it.todo("removes every doc and file under users/{uid} and the Auth user; twice is fine; others untouched");
});
describe('F2 purgeTombstones', () => {
  it.todo('removes only tombstones older than 180 days');
});
describe('F3 purgeInactive', () => {
  it.todo('removes only accounts idle over 18 months');
});

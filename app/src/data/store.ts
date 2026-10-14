// The data layer's interface. db.ts implements it on expo-sqlite (iOS, Android); db.web.ts and
// Jest use the in-memory store. Both are generated from the table specs in tables.ts.
import type { Tables } from './tables';

export interface KittedStore extends Tables {
  /** Opens the database and runs pending migrations. Idempotent. */
  init(): Promise<void>;
  /** The schema version after init (PRAGMA user_version). */
  schemaVersion(): Promise<number>;
  getKv(key: string): Promise<string | null>;
  setKv(key: string, value: string): Promise<void>;
  deleteKv(key: string): Promise<void>;
  /** Deletes every row in every table (resetData). The schema stays. */
  wipe(): Promise<void>;
}

/** kv keys used across the app. */
export const KV = {
  onboardingDone: 'onboarding.done',
  onboardingStep: 'onboarding.step',
  appearance: 'appearance',
  lastOccasion: 'occasion.last',
  ideaTime: 'idea.time',
  scenario: 'demo.scenario',
  seedLoaded: 'seed.loaded',
  /** You › Notifications (Y6): '1' on, '0' off; unset = on. P6 (expo-notifications) schedules from these. */
  notifyIdea: 'notify.idea',
  notifyReady: 'notify.ready',
  notifyTrial: 'notify.trial',
  /** How many new checks played the full score reveal (features/fitcheck/reveal.ts): the tape shows for the first 5. */
  revealFullShown: 'reveal.fullShown',
} as const;

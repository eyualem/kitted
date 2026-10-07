// The data layer's interface. db.ts implements it on expo-sqlite (iOS, Android);
// db.web.ts implements it in memory for the web preview (expo-sqlite's web build needs
// WASM + COOP/COEP headers, which would break the preview loop; 05 S9).
// Repositories for checks, closet, looks, chat and profile are added phase by phase.

export interface KittedStore {
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
} as const;

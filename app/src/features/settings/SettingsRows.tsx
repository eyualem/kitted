// T34 stub (the test writer's): You's settings rows, to be built per tasks/T34/IMPLEMENTATION.md → Interfaces. It
// renders nothing, so the tests fail on the missing behaviour instead of on a missing import (T34: not built).
import type { JSX } from 'react';

export interface SettingsRowsProps {
  /** Defaults to NOTIFICATIONS_BUILT (@/config/features). Tests pass it. */
  notificationsBuilt?: boolean;
  /** Defaults to SUPPORT_EMAIL, PRIVACY_URL, TERMS_URL (@/config/links). Tests pass them. */
  links?: { support: string | null; privacy: string | null; terms: string | null };
}

export function SettingsRows(props?: SettingsRowsProps): JSX.Element {
  void props;
  return <></>;
}

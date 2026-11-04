// The Privacy screen's backup line (#386, 11-firestore-schema.md §11.1).
import { t } from '@/i18n/en';
import type { BackupStatus } from '@/sync/backup';

/** The backup line's value, or null while he isn't signed in to an account that backs up. */
export function backupText(s: BackupStatus): string | null {
  switch (s.kind) {
    case 'off':
      return null;
    case 'never':
      return t('backup.never');
    case 'syncing':
      return t('backup.syncing');
    case 'waiting':
      return t('backup.waiting');
    case 'offline':
      return t('backup.offline');
    case 'upToDate':
      return t('backup.upToDate');
  }
}

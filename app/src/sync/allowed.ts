// The one place that decides whether backup may run on this phone at all (SB-GATE): the ACCOUNTS_BUILT switch, an iPhone, and
// not a demo screen. Everything that starts backup, restore or a server call asks here first.
import { Platform } from 'react-native';
import { ACCOUNTS_BUILT } from '@/config/features';
import { getDemoArgs } from '@/state/session';

/** `ACCOUNTS_BUILT && platformOS === 'ios' && demoScreen === null`. `ACCOUNTS_BUILT` is read when this is called. There is no
 *  Jest check in here: the tests pass their own env. */
export function syncAllowed(env: { platformOS?: string; demoScreen?: number | null } = {}): boolean {
  const platformOS = env.platformOS ?? Platform.OS;
  const demoScreen = env.demoScreen === undefined ? getDemoArgs().demoScreen : env.demoScreen;
  return ACCOUNTS_BUILT && platformOS === 'ios' && demoScreen === null;
}

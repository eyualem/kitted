// T41 (SB10.1): Apple's first name fills an empty name and never replaces one he typed (F1.4). Not built yet.
import type { KittedStore } from '@/data/store';

/** Apple's `givenName` (as createSignIn returns it) goes to his name only when none is set, cleaned like About you's
 *  name (aboutStep.cleanName: trimmed, 30 characters). Where it goes: his profile's `name` when the profile exists; mid
 *  setup (no profile yet) the About you draft in kv `onboarding.about` (its `name`, keeping the age pick), so About you,
 *  or the restore's completeOnboarding, carries it. Returns the name it set, or null when it set nothing (a name was
 *  there, or the given name was empty, whitespace or missing). Sends nothing anywhere. */
export async function applyAppleFirstName(_store: Pick<KittedStore, 'getKv' | 'setKv' | 'profile'>, _givenName: string | null | undefined): Promise<string | null> {
  throw new Error('T41: not built');
}

// "About you" (10-onboarding.md §10.1, #371): height, build and fit, from Kit's card. The same controls as You → Style
// profile (BasicsFields), all starting from what he's given (blank on a new install). Save writes through You's code
// and marks the card; X keeps nothing.
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KButton, KCard, KText } from '@/design-system';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import { SheetScaffold } from '@/features/sheet/SheetScaffold';
import { BasicsFields, type BasicsValues } from '@/features/you/BasicsFields';
import { draftOf } from '@/features/you/profile';
import { t } from '@/i18n/en';
import { canSave } from './rules';
import { aboutYou } from './session';

export function AboutYouSheet() {
  const { msg } = useLocalSearchParams<{ msg?: string }>();
  const profile = useLive(['profile'], () => store.profile.get('me'), []);
  const [edits, setEdits] = useState<BasicsValues | null>(null);
  const [saving, setSaving] = useState(false);
  const stored = profile ? draftOf(profile) : null;
  const value: BasicsValues = edits ?? { heightIn: stored?.heightIn ?? null, build: stored?.build ?? null, fit: stored?.fit ?? null };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await aboutYou.save(msg ?? null, value);
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    // Title only: the sheet's header is sticky, and at the largest text sizes a long subtitle there hid the fields. The
    // note scrolls with them.
    <SheetScaffold title={t('about.sheet.title')}>
      <KCard>
        <BasicsFields value={value} units={profile?.units ?? 'imperial'} onChange={(p) => setEdits({ ...value, ...p })} />
      </KCard>
      <KText variant="footnote" color="ink3" style={{ paddingHorizontal: 4 }}>
        {t('about.sheet.note')}
      </KText>
      <KButton title={t('common.save')} onPress={() => void save()} disabled={!canSave(value) || saving} />
    </SheetScaffold>
  );
}

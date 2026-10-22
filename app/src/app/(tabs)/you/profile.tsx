// Y2 · Style profile (02 §3.6 Y2; revised #246): Basics (height, build, fit; birth year read-only), Styles (up to 3,
// numbered in pick order) and Budget per piece (only ever asked; "Prefer not to say" is an answer). `Save` in the
// header is on once something changed. It writes the profile row the way onboarding does; none of this moves a
// score (picks only order tips and break "Reads as" ties, #211).
// How bold (02 Y2) is left out on purpose: `profile.boldness` feeds the scoring engine today (parts.ts color and the
// focal allowance) and the Why sheet re-explains old checks with it, so editing it here would change scores.
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Stack, router, useNavigation } from 'expo-router';
import { Chip, ChipFlow, KCard, KText, MonoLabel, RowDivider, opacity, space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import { styleLabel } from '@/features/morning/copy';
import { LOOKS, MAX_PICKS, togglePick } from '@/features/onboarding/looks';
import { NumberedPill } from '@/features/you/NumberedPill';
import { BasicsFields, Row } from '@/features/you/BasicsFields';
import { BUDGETS, budgetLabel, draftOf, isDirty, saveDraft, type ProfileDraft } from '@/features/you/profile';
import { t } from '@/i18n/en';

export default function StyleProfileScreen() {
  const { colors } = useTheme();
  const profile = useLive(['profile'], () => store.profile.get('me'), []);
  // His edits; until the first one the draft is the stored profile.
  const [edits, setEdits] = useState<ProfileDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const draft = edits ?? (profile ? draftOf(profile) : null);

  const dirty = !!profile && !!draft && isDirty(profile, draft);
  const update = (patch: Partial<ProfileDraft>) => {
    if (draft) setEdits({ ...draft, ...patch });
  };

  const save = async () => {
    if (!draft || saving) return;
    setSaving(true);
    try {
      await saveDraft(store, draft);
      if (router.canGoBack()) router.back();
    } finally {
      setSaving(false);
    }
  };

  // Leaving any way (Back, a swipe) keeps what he changed, like Settings (09-ui-review §12). saveDraft writes only a
  // real change, so leaving after Save writes nothing more.
  const latest = useRef<ProfileDraft | null>(null);
  useEffect(() => {
    latest.current = edits;
  }, [edits]);
  const navigation = useNavigation();
  useEffect(() => navigation.addListener('beforeRemove', () => {
    if (latest.current) void saveDraft(store, latest.current).catch((e: unknown) => console.error('[profile] save on leave failed', e));
  }), [navigation]);

  const units = profile?.units ?? 'imperial';
  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: colors.bg }}
        contentContainerStyle={{ padding: space.gutter, gap: space.s, paddingBottom: space.xxxl }}
      >
        {profile && draft ? (
          <>
            <Section title={t('profile.basics')}>
              <KCard>
                <BasicsFields value={draft} units={units} onChange={update} />
                <RowDivider inset={space.rowX} />
                <Row label={t('onb.basics.birthYear')}>
                  <KText variant="callout" color="ink2" tabular>
                    {profile.birthYear !== null ? String(profile.birthYear) : t('profile.birthYearNone')}
                  </KText>
                </Row>
              </KCard>
              <Footer>{t('profile.birthYearNote')}</Footer>
            </Section>

            <Section title={t('profile.styles')} right={t('profile.stylesMax')}>
              <KCard>
                <View style={{ paddingHorizontal: space.rowX, paddingVertical: space.xs }}>
                  <ChipFlow accessibilityLabel={t('profile.styles')}>
                    {LOOKS.map(({ style }) => {
                      const at = draft.picks.indexOf(style);
                      const picked = at >= 0;
                      return (
                        <NumberedPill
                          key={style}
                          n={picked ? at + 1 : undefined}
                          title={styleLabel(style)}
                          filled={picked}
                          accessibilityLabel={picked ? t('profile.a11y.pick', { style: styleLabel(style), n: at + 1 }) : styleLabel(style)}
                          onPress={() => {
                            const r = togglePick(draft.picks, style);
                            if (!r.full) update({ picks: r.picks });
                          }}
                        />
                      );
                    })}
                  </ChipFlow>
                </View>
              </KCard>
              <Footer>{draft.picks.length >= MAX_PICKS ? t('profile.stylesFull') : t('profile.stylesOrder')}</Footer>
            </Section>

            <Section title={t('profile.budget')}>
              <KCard>
                <View style={{ paddingHorizontal: space.rowX, paddingVertical: space.xs }}>
                  <ChipFlow accessibilityLabel={t('profile.budget')}>
                    {BUDGETS.map((b) => (
                      <Chip key={b} title={budgetLabel(b)} state={draft.budget === b ? 'selected' : 'normal'} onPress={() => update({ budget: draft.budget === b ? null : b })} />
                    ))}
                  </ChipFlow>
                </View>
              </KCard>
              <Footer>{t('profile.budgetNote')}</Footer>
            </Section>
          </>
        ) : null}
      </ScrollView>
      <Stack.Screen options={{ headerRight: () => <SaveButton enabled={dirty && !saving} onPress={() => void save()} /> }} />
    </>
  );
}

function SaveButton({ enabled, onPress }: { enabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      accessibilityRole="button"
      accessibilityLabel={t('common.save')}
      accessibilityState={{ disabled: !enabled }}
      hitSlop={8}
      style={({ pressed }) => ({ opacity: !enabled ? opacity.disabled : pressed ? opacity.pressed : 1, paddingHorizontal: 6, minHeight: 28, justifyContent: 'center' })}
    >
      <KText variant="body" weight="600" color="ink" maxFontSizeMultiplier={1.4}>
        {t('common.save')}
      </KText>
    </Pressable>
  );
}

function Section({ title, right, children }: { title: string; right?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space.s, marginTop: space.m }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.m, paddingHorizontal: space.xs }} accessibilityRole="header">
        <MonoLabel>{title}</MonoLabel>
        {right ? (
          <KText variant="footnote" color="ink3">
            {right}
          </KText>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function Footer({ children }: { children: string }) {
  return (
    <KText variant="footnote" color="ink3" style={{ paddingHorizontal: space.xs }}>
      {children}
    </KText>
  );
}

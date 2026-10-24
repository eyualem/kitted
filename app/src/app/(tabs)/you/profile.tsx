// Y2 · Style profile (02 §3.6 Y2; revised #246): Basics (height, build, fit; birth year read-only), Styles (up to 3,
// numbered in pick order) and Budget per piece (only ever asked; "Prefer not to say" is an answer). Leaving any way
// saves, so the header says `Done` (#370), not Save. It writes the profile row the way onboarding does (a blank one
// when none is stored); none of this moves a score (picks only order tips and break "Reads as" ties, #211). A 4th
// look buzzes, shakes and says "That's 3", like onboarding's.
// How bold (02 Y2) is left out on purpose: `profile.boldness` feeds the scoring engine today (parts.ts color and the
// focal allowance) and the Why sheet re-explains old checks with it, so editing it here would change scores.
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, View } from 'react-native';
import { Stack, router, useNavigation } from 'expo-router';
import { Chip, ChipFlow, KCard, KText, MonoLabel, RowDivider, opacity, radius, space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import { styleLabel } from '@/features/morning/copy';
import { BUILDS, buildLabel, FITS, fitLabel, heightSpoken, stepHeight, type Build, type FitPref } from '@/features/onboarding/basics';
import { LOOKS, MAX_PICKS, togglePick } from '@/features/onboarding/looks';
import { Segmented } from '@/features/onboarding/Segmented';
import { NumberedPill } from '@/features/you/NumberedPill';
import { BUDGETS, blankProfile, budgetLabel, draftOf, heightText, saveDraft, type ProfileDraft } from '@/features/you/profile';
import { sessionClock } from '@/state/session';
import { t } from '@/i18n/en';

export default function StyleProfileScreen() {
  const { colors } = useTheme();
  const stored = useLive(['profile'], () => store.profile.get('me'), []);
  // None stored (an install that skipped onboarding): edit a blank one; the first change creates the row.
  const profile = stored === undefined ? undefined : (stored ?? blankProfile(0));
  // His edits; until the first one the draft is the stored profile.
  const [edits, setEdits] = useState<ProfileDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [shake, setShake] = useState<Record<string, number>>({});
  const draft = edits ?? (profile ? draftOf(profile) : null);

  const update = (patch: Partial<ProfileDraft>) => {
    if (draft) setEdits({ ...draft, ...patch });
  };

  const save = async () => {
    if (!draft || saving) return;
    setSaving(true);
    try {
      await saveDraft(store, draft, sessionClock.nowMs());
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
    if (latest.current) void saveDraft(store, latest.current, sessionClock.nowMs()).catch((e: unknown) => console.error('[profile] save on leave failed', e));
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
              <KCard radius={radius.cardSmall}>
                <Row label={t('onb.basics.height')}>
                  <HeightStepper
                    value={draft.heightIn !== null ? heightText(draft.heightIn, units) : null}
                    spoken={draft.heightIn !== null ? (units === 'metric' ? heightText(draft.heightIn, units) : heightSpoken(draft.heightIn)) : t('onb.basics.heightAdd')}
                    onStep={(d) => update({ heightIn: stepHeight(draft.heightIn, d) })}
                  />
                </Row>
                <RowDivider inset={space.rowX} />
                <Field label={t('onb.basics.build')}>
                  <Segmented<Build> label={t('onb.basics.build')} value={draft.build} onChange={(v) => update({ build: v })} options={BUILDS.map((v) => ({ value: v, label: buildLabel(v) }))} />
                </Field>
                <RowDivider inset={space.rowX} />
                <Field label={t('onb.basics.fit')}>
                  <Segmented<FitPref> label={t('onb.basics.fit')} value={draft.fit} onChange={(v) => update({ fit: v })} options={FITS.map((v) => ({ value: v, label: fitLabel(v) }))} />
                </Field>
                <RowDivider inset={space.rowX} />
                <Row
                  label={t('onb.basics.birthYear')}
                  spoken={t('settings.a11y.value', { label: t('onb.basics.birthYear'), value: profile.birthYear !== null ? String(profile.birthYear) : t('profile.birthYearNone') })}
                >
                  <KText variant="callout" color="ink2" tabular>
                    {profile.birthYear !== null ? String(profile.birthYear) : t('profile.birthYearNone')}
                  </KText>
                </Row>
              </KCard>
              <Footer>{t('profile.birthYearNote')}</Footer>
            </Section>

            <Section title={t('profile.styles')} right={t('profile.stylesMax')}>
              <KCard radius={radius.cardSmall}>
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
                          shake={shake[style] ?? 0}
                          onPress={() => {
                            const r = togglePick(draft.picks, style);
                            if (!r.full) {
                              update({ picks: r.picks });
                              return;
                            }
                            // A 4th look: answer like onboarding (buzz, shake, the line read out; the footer says it).
                            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                            setShake((m) => ({ ...m, [style]: (m[style] ?? 0) + 1 }));
                            AccessibilityInfo.announceForAccessibility?.(t('profile.stylesFull'));
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
              <KCard radius={radius.cardSmall}>
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
      <Stack.Screen options={{ headerRight: () => <DoneButton enabled={!saving} onPress={() => void save()} /> }} />
    </>
  );
}

/** Done: saves what changed (leaving any other way does too) and goes back. */
function DoneButton({ enabled, onPress }: { enabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      accessibilityRole="button"
      accessibilityLabel={t('common.done')}
      accessibilityState={{ disabled: !enabled }}
      hitSlop={8}
      style={({ pressed }) => ({ opacity: !enabled ? opacity.disabled : pressed ? opacity.pressed : 1, paddingHorizontal: 6, minHeight: 28, justifyContent: 'center' })}
    >
      <KText variant="body" weight="600" color="ink" maxFontSizeMultiplier={1.4}>
        {t('common.done')}
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

/** A 52 pt row: label left, control right (stacked at accessibility sizes). `spoken` makes a read-only row one
 *  VoiceOver element ("Birth year, 2005"); a row holding a control lets the control speak. */
function Row({ label, spoken, children }: { label: string; spoken?: string; children: React.ReactNode }) {
  const { isAccessibilitySize } = useTheme();
  return (
    <View
      accessible={!!spoken}
      accessibilityLabel={spoken}
      style={[
        { minHeight: 52, paddingHorizontal: space.rowX, paddingVertical: space.s },
        isAccessibilitySize ? { gap: space.xs } : { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.m },
      ]}
    >
      <KText variant="callout" weight="500" accessibilityElementsHidden importantForAccessibility="no">
        {label}
      </KText>
      {children}
    </View>
  );
}

/** A label above its full-width control (the segmented build and fit). */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ paddingHorizontal: space.rowX, paddingVertical: space.m, gap: space.s }}>
      <KText variant="callout" weight="500" accessibilityElementsHidden importantForAccessibility="no">
        {label}
      </KText>
      {children}
    </View>
  );
}

function HeightStepper({ value, spoken, onStep }: { value: string | null; spoken: string; onStep: (d: 1 | -1) => void }) {
  const { colors } = useTheme();
  const circle = (d: 1 | -1) => (
    <Pressable
      onPress={() => onStep(d)}
      hitSlop={7}
      style={({ pressed }) => ({ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, opacity: pressed ? opacity.pressed : 1 })}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <KText variant="title3" weight="500">
        {d === 1 ? '+' : '−'}
      </KText>
    </Pressable>
  );
  return (
    <View
      style={{ minHeight: 36, minWidth: 150, paddingVertical: 3, paddingHorizontal: 4, borderRadius: 18, borderCurve: 'continuous', flexDirection: 'row', alignItems: 'center', gap: space.s, backgroundColor: colors.surface2 }}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={t('onb.basics.height')}
      accessibilityValue={{ text: spoken }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => onStep(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
    >
      {circle(-1)}
      <KText variant="callout" weight={value ? '600' : '500'} color={value ? 'ink' : 'ink3'} tabular style={{ flex: 1, textAlign: 'center' }}>
        {value ?? t('onb.basics.heightAdd')}
      </KText>
      {circle(1)}
    </View>
  );
}

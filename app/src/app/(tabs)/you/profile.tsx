// Y2 · Style profile (02 §3.6 Y2; revised #246): Basics (his first name, editable; fit; his age band read-only, T39 OS4.6
// and SY4; height and build gone since #375), Styles (up to 3,
// numbered in pick order) and Budget per piece (only ever asked; "Prefer not to say" is an answer). Leaving any way
// saves, so the header says `Done` (#370), not Save. It writes the profile row the way onboarding does (a blank one
// when none is stored); none of this moves a score (picks only order tips and break "Reads as" ties, #211). A 4th
// look buzzes, shakes and says "That's 3", like onboarding's.
// How bold (02 Y2) is left out on purpose: `profile.boldness` feeds the scoring engine today (parts.ts color and the
// focal allowance) and the Why sheet re-explains old checks with it, so editing it here would change scores.
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Stack, router, useNavigation } from 'expo-router';
import { Chip, ChipFlow, KCard, KText, MonoLabel, RowDivider, opacity, radius, space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import { styleLabel } from '@/features/morning/copy';
import { LOOKS, MAX_PICKS, togglePick } from '@/features/onboarding/looks';
import { NumberedPill } from '@/features/you/NumberedPill';
import { BasicsFields } from '@/features/you/BasicsFields';
import { BUDGETS, ageRowValue, blankProfile, budgetLabel, draftOf, saveDraft, type ProfileDraft } from '@/features/you/profile';
import { NAME_MAX } from '@/features/onboarding/aboutStep';
import { CONTROL_TEXT_MAX_SCALE } from '@/design-system/tokens';
import { textStyles } from '@/design-system/typography';
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
                <NameRow value={draft.name} onChange={(name) => update({ name })} />
                <RowDivider inset={space.rowX} />
                <BasicsFields value={draft} onChange={update} />
                <RowDivider inset={space.rowX} />
                <AgeRow profile={profile} />
              </KCard>
              <Footer testID="profile-basics-note">{t('profile.ageNote')}</Footer>
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

function Footer({ children, testID }: { children: string; testID?: string }) {
  return (
    <KText testID={testID} variant="footnote" color="ink3" style={{ paddingHorizontal: space.xs }}>
      {children}
    </KText>
  );
}

/** A 52 pt row: label left, value right; stacked at accessibility sizes (as BasicsFields' Row). */
function rowStyle(stacked: boolean) {
  return [
    { minHeight: 52, paddingHorizontal: space.rowX, paddingVertical: space.s },
    stacked ? { gap: space.xs } : { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, gap: space.m },
  ];
}

/** Name (SY4): an inline field, in ink so it reads as editable next to Age's ink2 value. A tap anywhere on the row
 *  focuses it; VoiceOver reads the field itself ("Name", text field). Saved the way the page saves (Done, Back, a swipe). */
function NameRow({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { colors, isAccessibilitySize } = useTheme();
  const input = useRef<TextInput>(null);
  return (
    <Pressable testID="profile-name-row" accessible={false} onPress={() => input.current?.focus()} style={rowStyle(isAccessibilitySize)}>
      <KText variant="callout" weight="500" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {t('profile.name')}
      </KText>
      <TextInput
        ref={input}
        testID="profile-name-input"
        value={value}
        onChangeText={onChange}
        placeholder={t('onb.about.namePlaceholder')}
        placeholderTextColor={colors.ink3}
        accessibilityLabel={t('profile.name')}
        maxLength={NAME_MAX}
        autoCapitalize="words"
        autoComplete="given-name"
        textContentType="givenName"
        autoCorrect={false}
        returnKeyType="done"
        clearButtonMode="while-editing"
        allowFontScaling
        maxFontSizeMultiplier={CONTROL_TEXT_MAX_SCALE}
        style={{
          flex: isAccessibilitySize ? undefined : 1, color: colors.ink, fontSize: textStyles.callout.fontSize, textAlign: isAccessibilitySize ? 'left' : 'right',
          paddingVertical: space.xs,
        }}
      />
    </Pressable>
  );
}

/** Age (OS4.6): read-only, one VoiceOver element ("Age, 22–25"); an older profile shows the band from its birth year. */
function AgeRow({ profile }: { profile: Parameters<typeof ageRowValue>[0] }) {
  const { isAccessibilitySize } = useTheme();
  const v = ageRowValue(profile, sessionClock.now().getFullYear());
  return (
    <View testID="profile-age-row" accessible accessibilityLabel={v.spoken} style={rowStyle(isAccessibilitySize)}>
      <KText variant="callout" weight="500" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {t('profile.age')}
      </KText>
      <KText testID="profile-age-value" variant="callout" color="ink2">
        {v.shown}
      </KText>
    </View>
  );
}

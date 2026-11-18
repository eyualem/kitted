// NOT ROUTED since T113: /onboarding/looks is the style game (StyleGameScreen). Kept only until the T39 tests that still
// mount it (T39-setupScreens OS3.1–OS3.3 and OS4.5, T39-offerCard OS5.7, looksOwnWords) are retargeted to the game;
// delete it with that change (tasks/T113/TASK.md).
// O2 · Pick looks (02 D2, update Oct 9, DECISIONS-LOG #173): 7 style tiles drawn in code, up to 3 picks, a
// "Something else?" tile for his own words, Continue · N of 3 (no Not sure since Nov 11, DECISIONS-LOG #449: setup
// is 7 taps to the camera). The picks wait in kv until About you ends
// setup (onboarding.looks, onboarding.otherStyle). Since T39 (OS3) the question is a plain title and line, not a Kit
// bubble.
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Keyboard, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { KButton, KText, space, useTheme } from '@/design-system';
import { CONTROL_TEXT_MAX_SCALE, radius, size } from '@/design-system/tokens';
import { textStyles } from '@/design-system/typography';
import { store } from '@/data/db';
import type { StyleKey } from '@/data/types';
import { normStyleKey } from '@/data/types';
import { t } from '@/i18n/en';
import { LOOKS_KEY, OTHER_STYLE_KEY } from './basics';
import { LookTile } from './LookTile';
import { cleanOtherWords, LOOKS, togglePick } from './looks';
import { OnboardingNav } from './OnboardingNav';
import { setResumeStep } from './resume';


const GAP = 10;

export function PickLooksScreen() {
  const { colors, isAccessibilitySize } = useTheme();
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  // The grid's own width (the web preview's phone frame is narrower than the window).
  const [gridW, setGridW] = useState(0);
  const width = gridW || window.width - 2 * space.gutter;
  const [picks, setPicks] = useState<StyleKey[]>([]);
  const [shake, setShake] = useState<Record<string, number>>({});
  const [maxNote, setMaxNote] = useState(false);
  const [editing, setEditing] = useState(false);
  const [words, setWords] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scroll = useRef<ScrollView>(null);
  const input = useRef<TextInput>(null);

  // Back from O3 keeps what he picked.
  useEffect(() => {
    void (async () => {
      const raw = await store.getKv(LOOKS_KEY);
      try {
        const saved = raw ? (JSON.parse(raw) as unknown[]).map(normStyleKey).filter((s): s is StyleKey => s !== null) : [];
        if (saved.length) setPicks(saved.slice(0, 3));
      } catch { /* a bad draft starts fresh */ }
      setWords((await store.getKv(OTHER_STYLE_KEY)) ?? '');
    })();
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);

  // While the keyboard is up the dock sits right on it (no home-bar gap under the button).
  const [keyboardUp, setKeyboardUp] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardWillShow', () => setKeyboardUp(true));
    const hide = Keyboard.addListener('keyboardWillHide', () => setKeyboardUp(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  // His own words sit under the grid, at the end of the scroll. When the keyboard shrinks the scroll to the space
  // above it, bring the field into view so he sees what he types (founder, Nov 11).
  // Focus the field once it's on screen. `autoFocus` alone didn't hold on iOS when the field mounted from the tile's
  // press: the field showed with no cursor and no keyboard, so typing went nowhere until a second tap (Nov 11).
  useEffect(() => {
    if (!editing) return;
    const id = setTimeout(() => input.current?.focus(), 50);
    return () => clearTimeout(id);
  }, [editing]);
  const keepFieldInView = () => {
    if (input.current?.isFocused()) scroll.current?.scrollToEnd({ animated: true });
  };

  const columns = isAccessibilitySize ? 1 : 2;
  const tileW = Math.floor((width - GAP * (columns - 1)) / columns);
  const other = cleanOtherWords(words);

  const tap = (style: StyleKey) => {
    const r = togglePick(picks, style);
    if (r.full) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setShake((s) => ({ ...s, [style]: (s[style] ?? 0) + 1 }));
      setMaxNote(true);
      // iOS ignores live regions and alert roles on a view that just appeared: say it.
      AccessibilityInfo.announceForAccessibility?.(t('onb.looks.max'));
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setMaxNote(false), 2000);
      return;
    }
    void Haptics.selectionAsync();
    setPicks(r.picks);
  };

  const save = async (chosen: readonly StyleKey[], otherWords: string | null) => {
    await store.setKv(LOOKS_KEY, JSON.stringify(chosen));
    if (otherWords) await store.setKv(OTHER_STYLE_KEY, otherWords);
    else await store.deleteKv(OTHER_STYLE_KEY);
    await setResumeStep(store, 'basics');
    router.push('/onboarding/basics');
  };

  const back = () => (router.canGoBack() ? router.back() : router.replace('/onboarding/welcome'));
  const canContinue = picks.length > 0 || other !== null;

  return (
    // The dock and the field ride the keyboard, as on About you (BasicsScreen).
    <KeyboardAvoidingView behavior="padding" style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <OnboardingNav step={2} onBack={back} />
      <ScrollView ref={scroll} onLayout={keepFieldInView} contentContainerStyle={[styles.thread, { paddingBottom: space.xl }]} keyboardShouldPersistTaps="handled">
        {/* A plain title and line (T39, OS3): no Kit bubble on a setup screen. The grid sits 24 below (12 + the gap). */}
        <View style={styles.title}>
          <KText testID="looks-title" variant="largeTitle" accessibilityRole="header">
            {t('onb.looks.title')}
          </KText>
          <KText testID="looks-line" variant="body" color="ink2">
            {t('onb.looks.line')}
          </KText>
        </View>
        <View style={[styles.grid, { gap: GAP }]} onLayout={(e) => setGridW(e.nativeEvent.layout.width)}>
          {LOOKS.map((look) => (
            <LookTile key={look.style} look={look} width={tileW} selected={picks.includes(look.style)} order={picks.indexOf(look.style) + 1 || undefined} shake={shake[look.style] ?? 0} onPress={() => tap(look.style)} />
          ))}
          <Pressable
            onPress={() => (editing ? input.current?.focus() : setEditing(true))}
            accessibilityRole="button"
            accessibilityLabel={t('onb.looks.else.a11y')}
            style={[styles.other, { width: tileW, minHeight: columns === 2 ? 120 : undefined, backgroundColor: colors.surface, borderColor: other ? colors.ink : colors.line, borderWidth: other ? 2.5 : 1 }]}
          >
            <KText variant="subheadline" color="ink3" style={styles.center}>
              {t('onb.looks.else.title')}
            </KText>
            {/* Styled like a TextLink (ink semibold, #231); a real TextLink would nest a button inside the tile's button. */}
            <KText role="textLink" style={styles.center} numberOfLines={3}>
              {other ? t('onb.looks.else.saved', { words: other }) : t('onb.looks.else.cta')}
            </KText>
          </Pressable>
        </View>
        {editing ? (
          <TextInput
            ref={input}
            value={words}
            onChangeText={setWords}
            placeholder={t('onb.looks.else.placeholder')}
            placeholderTextColor={colors.ink3}
            maxLength={80}
            returnKeyType="done"
            // Done closes it. A blur doesn't: a blur right after it opened took it away, so the first tap on the
            // tile seemed to do nothing (founder, Nov 11).
            onSubmitEditing={() => { setEditing(false); Keyboard.dismiss(); }}
            accessibilityLabel={t('onb.looks.else.a11y')}
            allowFontScaling
            maxFontSizeMultiplier={CONTROL_TEXT_MAX_SCALE}
            style={[styles.input, { color: colors.ink, backgroundColor: colors.surface, borderColor: colors.line }]}
          />
        ) : null}
      </ScrollView>
      <View style={[styles.dock, { paddingBottom: keyboardUp ? space.s : Math.max(insets.bottom, space.l) }]}>
        {/* The grid runs past the screen, so the 4th-tap note sits by the button where he can see it. */}
        {maxNote ? (
          <KText variant="footnote" color="ink2" style={styles.center}>
            {t('onb.looks.max')}
          </KText>
        ) : null}
        <KButton
          title={picks.length ? t('onb.looks.continueCount', { n: picks.length }) : t('onb.looks.continue')}
          disabled={!canContinue}
          onPress={() => void save(picks, other)}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  thread: { paddingHorizontal: space.gutter, paddingTop: space.s, gap: space.m },
  title: { gap: space.xs, marginBottom: space.m },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  other: { borderRadius: radius.look + 1, padding: space.m, alignItems: 'center', justifyContent: 'center', gap: space.xs },
  center: { textAlign: 'center' },
  // Body size; scales with Dynamic Type up to the control cap, and grows instead of clipping.
  input: { borderWidth: 1, borderRadius: 22, borderCurve: 'continuous', minHeight: size.hit, paddingHorizontal: space.l, paddingVertical: space.s, fontSize: textStyles.body.fontSize },
  dock: { paddingHorizontal: space.gutter, paddingTop: space.s, gap: space.s },
});

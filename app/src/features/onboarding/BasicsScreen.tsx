// About you (T39, specs/onboarding-screens.md OS4, specs/setup-and-you.md SY4; tasks/T39/DESIGN.md phones 2–5, 7): the
// last setup step, a plain screen (no chat bubbles, OS3). A first name ("What should Kit call you?") and five age
// choices with nothing picked. The name stays optional (Apple 5.1.1(x)) but setup nudges for it (#497): the field opens
// focused with the keyboard up, Continue waits for a name and an age, and a small Skip under it goes on without a name
// (off until an age is picked). His pick and the name as typed wait in kv (onboarding.about, never synced), so a close
// keeps both.
//
// Continue with an 18+ band ends setup (finishSetup: the profile with his band, no birth year, no agreement; Kit's
// first-check offer) and lands in Stylist; the camera opens only when he taps Check my fit there. "Under 18" asks once
// ("Under 18?"), then sets the age flag for good and the gate shows the stop screen. Restore (?restore=…, §4.4) is the
// same screen titled "Welcome back", without the name field, and goes on to bring back his fits.
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KButton, KText, space, useTheme } from '@/design-system';
import { CONTROL_TEXT_MAX_SCALE, size } from '@/design-system/tokens';
import { textStyles } from '@/design-system/typography';
import { store } from '@/data/db';
import { t } from '@/i18n/en';
import { newId } from '@/services/ids';
import { sessionClock } from '@/state/session';
import { setAgeBlocked, setOnboarded } from '@/state/appGate';
import { parseRestoreParam } from '@/features/account/account';
import { AGE_CHOICES, ageChoiceLabel, ageChoiceSpoken, ageChoiceTestID, cleanName, EMPTY_ABOUT, finishSetup, NAME_MAX, saveAbout, type AboutDraft, type AgeChoice } from './aboutStep';
import { loadDraft } from './basics';
import { ChoiceList, type Choice } from './ChoiceList';
import { OnboardingNav } from './OnboardingNav';

const CHOICES: readonly Choice<AgeChoice>[] = AGE_CHOICES.map((c) => ({ value: c, label: ageChoiceLabel(c), spoken: ageChoiceSpoken(c), testID: ageChoiceTestID(c) }));

/** A native-stack push takes about 350 ms; the name field asks for focus again after it (#497). */
export const FOCUS_AFTER_PUSH_MS = 450;

/** Hidden from VoiceOver as its own stop (the field's label, or the disabled Continue's hint, says it). */
const HIDDEN = { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' } as const;

export function BasicsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [about, setAbout] = useState<AboutDraft>(EMPTY_ABOUT);
  const [busy, setBusy] = useState(false);
  const [keyboard, setKeyboard] = useState(false);
  // Once he has typed or tapped, a late draft read never overwrites what he did.
  const touched = useRef(false);
  const latest = useRef<AboutDraft>(EMPTY_ABOUT);
  // Signed in from Welcome to an account that has his fits (10-onboarding.md §4.4): only this step, then A4.
  const { restore } = useLocalSearchParams<{ restore?: string }>();
  const restoring = parseRestoreParam(restore);
  const isRestore = restoring !== null;
  const nameField = useRef<TextInput>(null);

  useFocusEffect(
    useCallback(() => {
      void loadDraft(store).then((d) => {
        if (touched.current) return;
        latest.current = d.about;
        setAbout(d.about);
      });
    }, []),
  );

  // #497: with the name still empty, the keyboard opens on it. Asked for once the push is over: iOS drops a focus
  // asked for mid-slide (seen on the Simulator, Nov 18, with autoFocus). A saved name (a reopen mid-setup) gets no
  // keyboard, so the age choices stay in view.
  useFocusEffect(
    useCallback(() => {
      if (isRestore) return undefined;
      const id = setTimeout(() => {
        const f = nameField.current;
        if (f && cleanName(latest.current.name) === null && !f.isFocused?.()) f.focus?.();
      }, FOCUS_AFTER_PUSH_MS);
      return () => clearTimeout(id);
    }, [isRestore]),
  );

  // The dock rides above the keyboard with a small gap instead of the home-indicator inset.
  useEffect(() => {
    const show = Keyboard.addListener('keyboardWillShow', () => setKeyboard(true));
    const hide = Keyboard.addListener('keyboardWillHide', () => setKeyboard(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // Each pick and each change of the name writes the draft at once (a close keeps both).
  const change = (patch: Partial<AboutDraft>) => {
    touched.current = true;
    const next = { ...latest.current, ...patch };
    latest.current = next;
    setAbout(next);
    void saveAbout(store, next).catch((e: unknown) => console.error('[about] draft save failed', e));
  };

  const done = async () => {
    if (about.age === null || busy) return;
    if (about.age === 'under18') {
      // The block is for good (it outlives "Delete all my data"), so a mis-tap gets one chance to change (#276).
      const block = async () => {
        await setAgeBlocked(true);
        // The gate swaps the stacks; "/" sends him through it to the stop screen.
        router.replace('/');
      };
      Alert.alert(t('onb.about.under18.title'), t('onb.age.title'), [
        { text: t('onb.age.confirm.change'), style: 'cancel' },
        { text: t('onb.age.confirm.yes'), style: 'destructive', onPress: () => void block() },
      ]);
      return;
    }
    if (restoring) {
      router.replace({ pathname: '/onboarding/restore', params: { fits: restoring.fits, pieces: restoring.pieces, chats: restoring.chats } });
      return;
    }
    setBusy(true);
    try {
      await finishSetup(store, sessionClock.nowMs(), newId);
      await setOnboarded(true);
      // The gate swaps the onboarding stack for the tabs; "/" sends him through it to Stylist.
      router.replace('/');
    } catch (e: unknown) {
      // A failed save leaves him here with Continue working again (the gate opens only after every write).
      console.error('[about] finishing setup failed', e);
    } finally {
      setBusy(false);
    }
  };

  const back = () => (router.canGoBack() ? router.back() : router.replace(restoring ? '/onboarding/welcome' : '/onboarding/looks'));
  const none = about.age === null;
  // Restore has no name field, so only the age counts there.
  const noName = !restoring && cleanName(about.name) === null;
  const hint = noName ? t('onb.about.nameHint') : none ? t('onb.about.hint') : null;

  return (
    <KeyboardAvoidingView behavior="padding" style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <OnboardingNav step={restoring ? undefined : 3} onBack={back} />
      <ScrollView contentContainerStyle={styles.page} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled">
        <KText testID="about-title" variant="largeTitle" accessibilityRole="header">
          {t(restoring ? 'onb.restore.title' : 'onb.about.title')}
        </KText>
        {restoring ? (
          <KText testID="restore-line" variant="body" color="ink2" style={styles.line}>
            {t('onb.restore.line')}
          </KText>
        ) : (
          <>
            <KText testID="about-name-label" variant="headline" style={styles.question} {...HIDDEN}>
              {t('onb.about.nameLabel')}
            </KText>
            <TextInput
              ref={nameField}
              testID="about-name-input"
              value={about.name}
              onChangeText={(name) => change({ name })}
              placeholder={t('onb.about.namePlaceholder')}
              placeholderTextColor={colors.ink3}
              accessibilityLabel={t('onb.about.nameLabel')}
              maxLength={NAME_MAX}
              autoCapitalize="words"
              autoComplete="given-name"
              textContentType="givenName"
              autoCorrect={false}
              returnKeyType="done"
              clearButtonMode="while-editing"
              allowFontScaling
              maxFontSizeMultiplier={CONTROL_TEXT_MAX_SCALE}
              style={[styles.input, { color: colors.ink, backgroundColor: colors.surface, borderColor: colors.line }]}
            />
          </>
        )}
        <KText testID="about-age-label" variant="headline" accessibilityRole="header" style={styles.question}>
          {t('onb.about.ageLabel')}
        </KText>
        <ChoiceList testID="about-age-list" label={t('onb.about.ageLabel')} choices={CHOICES} value={about.age} onChange={(age) => change({ age })} />
        <KText testID="about-footnote" variant="footnote" color="ink3" style={styles.footnote}>
          {t('onb.about.footnote')}
        </KText>
      </ScrollView>
      <View style={[styles.dock, { paddingBottom: keyboard ? space.s : Math.max(insets.bottom, space.l) }]}>
        {/* Why the button is off (09 UI review): the one answer it waits for. VoiceOver hears it as Continue's hint. */}
        {hint !== null ? (
          <KText testID="about-hint" variant="footnote" color="ink2" style={styles.center} {...HIDDEN}>
            {hint}
          </KText>
        ) : null}
        <View testID="about-continue">
          <KButton
            title={t('onb.basics.cta')}
            disabled={none || noName || busy}
            accessibilityHint={hint ?? undefined}
            onPress={() => void done()}
          />
        </View>
        {/* #497: the only way on without a name; it does what Continue does, so it waits for an age too. */}
        {noName ? (
          <View testID="about-skip">
            <KButton
              title={t('onb.about.skip')}
              kind="ghost"
              size="regular"
              fullWidth
              disabled={none || busy}
              accessibilityHint={none ? t('onb.about.hint') : t('onb.about.skipHint')}
              onPress={() => void done()}
            />
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  page: { paddingHorizontal: space.gutter, paddingTop: space.s, paddingBottom: space.xxl },
  line: { marginTop: space.xs },
  // 24 above each question, 8 below it (DESIGN.md "Plain step layout").
  question: { marginTop: space.xxl, marginBottom: space.s },
  // The same field as Looks' "Something else?": body size, grows with Dynamic Type up to the control cap.
  input: { borderWidth: 1, borderRadius: 22, borderCurve: 'continuous', minHeight: size.hit, paddingHorizontal: space.l, paddingVertical: space.s, fontSize: textStyles.body.fontSize },
  footnote: { marginTop: space.m, paddingHorizontal: 4 },
  center: { textAlign: 'center' },
  dock: { paddingHorizontal: space.gutter, paddingTop: space.s, gap: space.s },
});

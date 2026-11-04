// Welcome's hero (10-onboarding.md §14, #388): the example outfit drawn by the closet's flats on a tile that stands for
// his fit pic, and the card that reads it: the score (on the real reveal's tape), the one fix and the closet line.
// The first showing in a launch plays it once (welcomePlay.ts); a tap skips to the end; Reduce Motion and VoiceOver
// get the resting card from the first frame. Sizes are final from the first frame: only opacity and transforms move.
import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import {
  Icon, KCard, KText, MonoLabel, REVEAL_END, RevealStepView, TapeNumeral, displayScore, fixed, radius, space, spokenScore, stepP, useTheme, type RevealStep,
} from '@/design-system';
import { PieceArt } from '@/features/closet/GarmentArt';
import { screenReaderOn, tapeValues, watchScreenReader } from '@/features/fitcheck/reveal';
import { t } from '@/i18n/en';
import type { WelcomeExample, WelcomePiece } from './welcomeExample';
import { lowerFirst, noteWelcomeShown, WELCOME_PLAN, WELCOME_PLAY_MS, welcomePlays } from './welcomePlay';

watchScreenReader();

/** The play's timeline: 0 → WELCOME_PLAY_MS once, or REVEAL_END (rest) from the first frame. */
export function useWelcomePlay(): { t: SharedValue<number>; skip: () => void } {
  const { a11y } = useTheme();
  const time = useSharedValue(welcomePlays({ reduceMotion: a11y.reduceMotion, voiceOver: screenReaderOn() }) ? 0 : REVEAL_END);
  useEffect(() => {
    noteWelcomeShown();
    if (time.get() < WELCOME_PLAY_MS) {
      time.set(withTiming(WELCOME_PLAY_MS, { duration: WELCOME_PLAY_MS - time.get(), easing: Easing.linear }));
    }
    return () => cancelAnimation(time);
  }, [time]);
  const skip = () => {
    cancelAnimation(time);
    time.set(REVEAL_END);
  };
  return { t: time, skip };
}

/** The drawn outfit, top to toe, on a tile: his fit pic, stood in for by the closet's own drawings (never a photo). */
export function WelcomeOutfit({ pieces, width, height, chip }: { pieces: readonly WelcomePiece[]; width: number; height: number; chip?: { t: SharedValue<number> } | null }) {
  const { colors } = useTheme();
  const shoes = pieces.filter((p) => p.garment.category === 'footwear');
  const body = pieces.filter((p) => p.garment.category !== 'footwear');
  // Room under the drawing for "Your fit", so it never sits on the shoes.
  const chipRoom = chip ? 40 : 0;
  // Shares of the tile's height: the top and the bottoms the same, the shoes shorter (they're drawn wide).
  const unit = (height - space.xl - chipRoom) / (body.length + 0.6 * shoes.length);
  const art = Math.round(Math.min(unit * 1.08, width * 0.86));
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width, height, borderRadius: radius.card, borderCurve: 'continuous', backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', paddingBottom: chipRoom, overflow: 'hidden' }}
    >
      {body.map((p, i) => (
        <View key={i} style={{ height: unit, justifyContent: 'center', marginVertical: -unit * 0.04 }}>
          <PieceArt item={p} size={art} />
        </View>
      ))}
      {shoes.map((p, i) => (
        <View key={`s${i}`} style={{ height: unit * 0.6, justifyContent: 'center' }}>
          <PieceArt item={p} size={Math.round(Math.min(unit * 0.95, width * 0.7))} />
        </View>
      ))}
      {chip ? (
        <RevealStepView t={chip.t} step={WELCOME_PLAN.chip} style={{ position: 'absolute', left: space.m, bottom: space.m }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: fixed.photoTag }}>
            <Icon name="camera" size={15} color="#FFFFFF" />
            <KText variant="footnote" weight="600" color="#FFFFFF" maxFontSizeMultiplier={1.4}>
              {t('onb.welcome.chip')}
            </KText>
          </View>
        </RevealStepView>
      ) : null}
    </View>
  );
}

/** The VoiceOver line for the resting card, read once. */
export function welcomeCardLabel(ex: WelcomeExample): string {
  const fix = ex.fixes[0];
  return t('onb.welcome.a11y', {
    score: spokenScore(ex.score),
    word: ex.word,
    fix: fix ? lowerFirst(fix.copy) : '',
    to: fix ? spokenScore(fix.to) : '',
    n: ex.pieces.length,
  });
}

/** The example card: tag, the score on the tape, the word, the one fix, the closet line. */
export function WelcomeCard({ ex, width, t: time }: { ex: WelcomeExample; width: number; t: SharedValue<number> }) {
  const { colors } = useTheme();
  const fix = ex.fixes[0];
  const P = WELCOME_PLAN;
  return (
    <RevealStepView t={time} step={P.card} style={{ width }}>
      <View accessible accessibilityLabel={welcomeCardLabel(ex)}>
        <KCard radius={radius.cardSmall}>
          <View style={{ paddingVertical: space.m, paddingHorizontal: space.m, gap: space.s }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.s }}>
              <MonoLabel>{t('onb.welcome.cardTag')}</MonoLabel>
              <MonoLabel>{t('onb.welcome.cardFull')}</MonoLabel>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.m }}>
              <TapeNumeral t={time} score={ex.score} values={tapeValues(ex.score)} size={50} tape={P.tape} swap={null} lock={P.lock} noDash />
              <RevealStepView t={time} step={P.word} style={{ flexShrink: 1 }}>
                <KText variant="subheadline" weight="600" maxFontSizeMultiplier={1.4}>{ex.word}</KText>
                <KText variant="caption" color="ink2" maxFontSizeMultiplier={1.4}>{t('onb.welcome.cardOccasion')}</KText>
              </RevealStepView>
              {/* "Reading your fit" sits over the score row until the tape starts. */}
              <ReadingLine t={time} />
            </View>
            {fix ? (
              <RevealStepView t={time} step={P.fix} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.s }}>
                <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1.3, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                  <KText variant="caption2" weight="700" maxFontSizeMultiplier={1}>1</KText>
                </View>
                <KText variant="footnote" weight="600" style={{ flex: 1 }} maxFontSizeMultiplier={1.4}>{fix.copy}</KText>
                <KText role="gain" maxFontSizeMultiplier={1.4}>{t('card.gainTo', { score: displayScore(fix.to) })}</KText>
              </RevealStepView>
            ) : null}
            <RevealStepView t={time} step={P.closet} style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <View style={{ width: 17, height: 17, borderRadius: 9, backgroundColor: colors.good, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="plus" size={10} color={colors.surface} weight="bold" />
              </View>
              <KText variant="caption" color="ink2" style={{ flexShrink: 1 }} maxFontSizeMultiplier={1.4}>{t('onb.welcome.added', { n: ex.pieces.length })}</KText>
            </RevealStepView>
          </View>
        </KCard>
      </View>
    </RevealStepView>
  );
}

function ReadingLine({ t: time }: { t: SharedValue<number> }) {
  const { colors } = useTheme();
  const out = WELCOME_PLAN.readingOut;
  // Shown from the start until the tape starts; past the play (rest) it's gone.
  return (
    <FadeOut t={time} step={out}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s, backgroundColor: colors.surface }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }} />
        <KText variant="subheadline" weight="600" color="ink2" maxFontSizeMultiplier={1.4}>{t('onb.welcome.reading')}</KText>
      </View>
    </FadeOut>
  );
}

/** The opposite of RevealStepView: visible until `step`, then gone. */
function FadeOut({ t: time, step, children }: { t: SharedValue<number>; step: RevealStep; children: ReactNode }) {
  const a = useAnimatedStyle(() => ({ opacity: 1 - stepP(time.get(), step) }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'center' }, a]}>
      {children}
    </Animated.View>
  );
}

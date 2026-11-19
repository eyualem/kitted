// T113 · Looks, as the style game (specs/style-game.md; replaces the grid, O2 · 02 D2): 8 "Is this your style?" cards (card 1 teaches the swipe first), then
// "Now put them in order" between his Me's, then "Here's your style". The game lives in the session (styleGameSession):
// this screen draws its stage and sends the taps there. Back undoes one step; on card 1 it goes to Welcome.
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, useWindowDimensions, View, type GestureResponderEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, KButton, KText, space, useTheme } from '@/design-system';
import { CONTROL_TEXT_MAX_SCALE } from '@/design-system/tokens';
import { store } from '@/data/db';
import { t } from '@/i18n/en';
import { cardLabel, GameCard } from './GameCard';
import { GameRanking } from './GameRanking';
import { GameResults } from './GameResults';
import { OnboardingNav } from './OnboardingNav';
import { CARD_COUNT, cardRelease, currentCard, mesOf, rankStep, swipeFeedback } from './styleGame';
import {
  answer, back, demoDragDx, finishTeach, getStyleGame, keepGoing, markLeaned, startOrResumeStyleGame, startOver, togglePeek, useStyleGame, type SessionState,
} from './styleGameSession';

export function StyleGameScreen() {
  const session = useStyleGame();
  useEffect(() => {
    void startOrResumeStyleGame(store);
  }, []);
  if (!session) return null;

  const onBack = async () => {
    if ((await back(store)) === 'exit') {
      if (router.canGoBack()) router.back();
      else router.replace('/onboarding/welcome');
    }
  };
  const nav = <OnboardingNav step={2} onBack={() => void onBack()} />;
  if (session.stage === 'results' && session.results) return <GameResults session={session} nav={nav} />;
  return <PlayStage session={session} nav={nav} />;
}

function PlayStage({ session, nav }: { session: SessionState; nav: React.ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const width = Math.max(0, window.width - 2 * space.gutter);
  const g = session.game;
  const step = session.stage === 'ranking' ? rankStep(g) : null;
  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      {nav}
      {step && !step.done ? (
        <ScrollView contentContainerStyle={styles.body}>
          <GameRanking key={`${g.seed}-${g.rounds.length}`} pair={step.pair} mes={mesOf(g).length} width={width} />
        </ScrollView>
      ) : (
        <CardsStage key={g.seed} session={session} width={width} />
      )}
    </View>
  );
}

function CardsStage({ session, width }: { session: SessionState; width: number }) {
  const { colors, isAccessibilitySize: ax } = useTheme();
  const insets = useSafeAreaInsets();
  const g = session.game;
  const look = currentCard(g);
  const index = g.answers.length;
  // The dock's presses, numbered: the card on screen answers the ones made after it showed.
  const [ask, setAsk] = useState<{ me: boolean; n: number } | null>(null);
  const [dragDx] = useState(() => demoDragDx());
  const [lit, setLit] = useState<'me' | 'notMe' | null>(() => (dragDx === undefined ? null : swipeFeedback(dragDx).lit));
  const cardW = Math.min(width, ax ? 240 : 300);

  const peek = () => {
    togglePeek();
    const s = getStyleGame();
    if (s && look) AccessibilityInfo.announceForAccessibility(cardLabel(look, index, s.peek));
  };

  // SG1.4: while the lesson is up (and while FS4's check is), Yes and No are dimmed and do nothing.
  const waiting = session.teach || session.checking;
  const button = (me: boolean) => (
    <View key={me ? 'me' : 'notme'} testID={me ? 'game-me' : 'game-notme'} style={[ax ? null : styles.flex, lit === (me ? 'me' : 'notMe') ? styles.lit : lit ? styles.unlit : null]}>
      <KButton
        kind={me ? 'primary' : 'secondary'}
        size="large"
        icon={me ? 'check' : 'close'}
        title={t(me ? 'game.me' : 'game.notMe')}
        disabled={waiting}
        onPress={() => setAsk((a) => ({ me, n: (a?.n ?? 0) + 1 }))}
      />
    </View>
  );

  return (
    <>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.title}>
          <KText testID="game-title" variant="largeTitle" accessibilityRole="header">
            {t('game.title')}
          </KText>
          <KText testID="game-line" variant="body" color="ink2">
            {t('game.line')}
          </KText>
        </View>
        {session.checking ? (
          <FastCheck width={cardW} />
        ) : look ? (
          <View style={styles.cardSlot}>
            <GameCard
              key={`${g.seed}-${index}`}
              ask={ask}
              look={look}
              index={index}
              peek={session.peek}
              leaned={session.leaned}
              dragDx={dragDx}
              width={cardW}
              focusOnMount={index > 0}
              locked={session.teach}
              leanArmed={session.leanArmed}
              onAnswer={(me, fast) => void answer(store, me, fast)}
              onPeek={peek}
              onLeaned={markLeaned}
              onLit={setLit}
            />
            {session.teach ? <Lesson width={cardW} /> : null}
          </View>
        ) : null}
        <View testID="game-progress" style={styles.progress} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {Array.from({ length: CARD_COUNT }, (_, i) => (
            <View
              key={i}
              testID={`game-progress-dot-${i}`}
              style={[styles.dot, { width: i === index ? 22 : 6, backgroundColor: i <= index ? colors.ink : colors.inkFaint }]}
            />
          ))}
        </View>
        <View style={styles.hints}>
          <KText testID="game-hint" variant="footnote" color="ink2" style={styles.center}>
            {t('game.hint')}
          </KText>
          <KText testID="game-peek-hint" variant="footnote" color="ink2" style={styles.center}>
            {t('game.peekHint')}
          </KText>
        </View>
      </ScrollView>
      {/* No on the left (it mirrors the swipe); at accessibility sizes stacked, Yes on top. */}
      <View style={[styles.dock, { flexDirection: ax ? 'column' : 'row', paddingBottom: Math.max(insets.bottom, space.l) }]}>
        {ax ? [button(true), button(false)] : [button(false), button(true)]}
      </View>
    </>
  );
}

/** SG1.4: card 1's lesson, laid over the card. One tap anywhere on it takes it away. */
/** Where a press touched down or let go, when the event says (a test's press may carry none). */
function pointOf(e: GestureResponderEvent | undefined): { x: number; y: number } | null {
  const n = e?.nativeEvent;
  return n && typeof n.pageX === 'number' && typeof n.pageY === 'number' ? { x: n.pageX, y: n.pageY } : null;
}

function Lesson({ width }: { width: number }) {
  const { colors } = useTheme();
  // A tap takes it away; a swipe across it doesn't (SG1.4: "a swipe does nothing"; verify round 3, C6). A Pressable
  // still calls onPress for a press that moved but let go inside it, so the release is held to the card's own tap
  // rule (under TAP_SLOP in any direction). A press with no coordinates counts as a tap.
  const down = useRef<{ x: number; y: number } | null>(null);
  const release = (e?: GestureResponderEvent) => {
    const from = down.current;
    down.current = null;
    const to = pointOf(e);
    if (from && to && cardRelease(to.x - from.x, to.y - from.y) !== 'peek') return;
    void finishTeach(store);
  };
  // The ink colour, a little see-through, so the outfit shows faintly under the words (light and dark alike).
  const scrim = /^#[0-9a-f]{6}$/i.test(colors.ink) ? `${colors.ink}E0` : colors.ink;
  return (
    <View style={styles.lessonWrap} pointerEvents="box-none">
      <Pressable
        onPressIn={(e) => {
          down.current = pointOf(e);
        }}
        onPress={release}
        accessibilityRole="button"
        accessibilityLabel={t('game.teach')}
        style={[styles.lesson, { width, backgroundColor: scrim }]}
      >
        <View style={styles.arrows}>
          <Icon name="arrow.left" size={28} color={colors.bg} weight="semibold" />
          <Icon name="arrow.right" size={28} color={colors.bg} weight="semibold" />
        </View>
        <KText variant="title3" weight="600" color={colors.bg} style={styles.center} maxFontSizeMultiplier={CONTROL_TEXT_MAX_SCALE}>
          {t('game.teach')}
        </KText>
      </Pressable>
    </View>
  );
}

/** FS4: after three fast No's from card 1, a check before card 4. */
function FastCheck({ width }: { width: number }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.check, { width, backgroundColor: colors.surface, borderColor: colors.line }]}>
      <KText variant="headline" weight="600" style={styles.center}>
        {t('game.check.line')}
      </KText>
      <KButton title={t('game.check.startOver')} onPress={startOver} />
      <KButton kind="secondary" title={t('game.check.keepGoing')} onPress={keepGoing} />
    </View>
  );
}

const styles = StyleSheet.create({
  cardSlot: { alignSelf: 'center' },
  lessonWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center' },
  lesson: { flex: 1, borderRadius: 18, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center', padding: space.xl, gap: space.l },
  arrows: { flexDirection: 'row', gap: space.xxl },
  check: { alignSelf: 'center', borderWidth: 1, borderRadius: 18, borderCurve: 'continuous', padding: space.xl, gap: space.m },
  root: { flex: 1 },
  body: { paddingHorizontal: space.gutter, paddingTop: space.s, paddingBottom: space.xl, gap: space.l },
  title: { gap: space.xs },
  progress: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  dot: { height: 6, borderRadius: 3 },
  hints: { gap: space.xxs },
  center: { textAlign: 'center' },
  dock: { paddingHorizontal: space.gutter, paddingTop: space.s, gap: space.s },
  flex: { flex: 1 },
  lit: { transform: [{ scale: 1.04 }] },
  unlit: { opacity: 0.55 },
});

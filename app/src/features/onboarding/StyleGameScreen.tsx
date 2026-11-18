// T113 · Looks, as the style game (specs/style-game.md; replaces the grid, O2 · 02 D2): 8 "Me or not me?" cards, then
// "Now put them in order" between his Me's, then "Here's your style". The game lives in the session (styleGameSession):
// this screen draws its stage and sends the taps there. Back undoes one step; on card 1 it goes to Welcome.
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KButton, KText, space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import { t } from '@/i18n/en';
import { cardLabel, GameCard, type GameCardHandle } from './GameCard';
import { GameRanking } from './GameRanking';
import { GameResults } from './GameResults';
import { OnboardingNav } from './OnboardingNav';
import { CARD_COUNT, currentCard, mesOf, rankStep, swipeFeedback } from './styleGame';
import {
  answer, back, demoDragDx, getStyleGame, markLeaned, startOrResumeStyleGame, togglePeek, useStyleGame, type SessionState,
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
  const card = useRef<GameCardHandle>(null);
  const [dragDx] = useState(() => demoDragDx());
  const [lit, setLit] = useState<'me' | 'notMe' | null>(() => (dragDx === undefined ? null : swipeFeedback(dragDx).lit));
  const cardW = Math.min(width, ax ? 240 : 300);

  const peek = () => {
    togglePeek();
    const s = getStyleGame();
    if (s && look) AccessibilityInfo.announceForAccessibility(cardLabel(look, index, s.peek));
  };

  const button = (me: boolean) => (
    <View key={me ? 'me' : 'notme'} testID={me ? 'game-me' : 'game-notme'} style={[ax ? null : styles.flex, lit === (me ? 'me' : 'notMe') ? styles.lit : lit ? styles.unlit : null]}>
      <KButton kind={me ? 'primary' : 'secondary'} size="large" title={t(me ? 'game.me' : 'game.notMe')} onPress={() => card.current?.leave(me)} />
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
        {look ? (
          <GameCard
            key={`${g.seed}-${index}`}
            ref={card}
            look={look}
            index={index}
            peek={session.peek}
            leaned={session.leaned}
            dragDx={dragDx}
            width={cardW}
            focusOnMount={index > 0}
            onAnswer={(me) => void answer(store, me)}
            onPeek={peek}
            onLeaned={markLeaned}
            onLit={setLit}
          />
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
      {/* Not me on the left (it mirrors the swipe); at accessibility sizes stacked, Me on top. */}
      <View style={[styles.dock, { flexDirection: ax ? 'column' : 'row', paddingBottom: Math.max(insets.bottom, space.l) }]}>
        {ax ? [button(true), button(false)] : [button(false), button(true)]}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
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

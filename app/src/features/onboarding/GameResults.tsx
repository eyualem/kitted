// T113 · "Here's your style" and "Nothing clicked yet" (specs/style-game.md SG3–SG6, SG7 FS2–FS3, SG9): his top looks
// in order, each row with its number, × and a drag handle (VoiceOver: Move up, Move down, Remove); Add a look; his own
// words; Continue to About you; Play again. Every change goes through the session (Back undoes it; the toast's Undo
// undoes its own one).
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo, Animated, findNodeHandle, Keyboard, PanResponder, Pressable, ScrollView, StyleSheet, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Icon, KButton, KText, opacity, space, useTheme } from '@/design-system';
import { CONTROL_TEXT_MAX_SCALE, size } from '@/design-system/tokens';
import { textStyles } from '@/design-system/typography';
import { store } from '@/data/db';
import type { StyleKey } from '@/data/types';
import { styleLabel } from '@/features/morning/copy';
import { showToast } from '@/features/toast/toast';
import { t } from '@/i18n/en';
import { LOOKS } from './looks';
import { lookLine, Outfit } from './LookTile';
import { canContinue, dragTarget, resultsHead } from './styleGame';
import {
  continueToAbout, moveInResults, openWords, playAgain, removeFromResults, saveWords, setWords, undoChange, type SessionState,
} from './styleGameSession';

const HEADS = {
  top: ['game.results.title', 'game.results.line'],
  one: ['game.results.title', 'game.results.lineOne'],
  empty: ['game.results.title', 'game.results.lineEmpty'],
  none: ['game.none.title', 'game.none.line'],
} as const;

/** A move (drag or VoiceOver), announced: "Streetwear, now 2 of 3" (founder question F4). */
async function moveRow(picks: readonly StyleKey[], from: number, to: number): Promise<void> {
  const look = picks[from];
  if (!look) return;
  const token = await moveInResults(store, from, to);
  if (token === null) return;
  AccessibilityInfo.announceForAccessibility(t('game.results.moved', { name: styleLabel(look), n: to + 1, total: picks.length }));
}

interface RowBox { y: number; height: number }
interface Drag { from: number; to: number; pitch: number }
interface DragCallbacks { count: number; move(from: number, to: number): void; setDrag(d: Drag | null): void }

/** The rows' drag, made once (its handlers and the rows' places live here, not in render). */
class RowDrag {
  readonly dragY = new Animated.Value(0);
  readonly handles: ReturnType<typeof PanResponder.create>[];
  private boxes: RowBox[] = [];
  private cb: DragCallbacks | null = null;

  constructor() {
    this.handles = [0, 1, 2].map((from) => this.handle(from));
  }

  update(cb: DragCallbacks) {
    this.cb = cb;
  }

  setBox(i: number, b: RowBox) {
    this.boxes[i] = b;
  }

  private pitch(): number {
    const [a, b] = this.boxes;
    if (a && b) return b.y - a.y;
    return a ? a.height + space.s : 0;
  }

  private handle(from: number) {
    let to = from;
    const finish = (commit: boolean) => {
      this.dragY.setValue(0);
      this.cb?.setDrag(null);
      if (commit && to !== from) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        this.cb?.move(from, to);
      }
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // While a row is held the list doesn't scroll (scrollEnabled is off) and nothing takes the touch.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        to = from;
        this.dragY.setValue(0);
        this.cb?.setDrag({ from, to, pitch: this.pitch() });
      },
      onPanResponderMove: (_e, g) => {
        this.dragY.setValue(g.dy);
        const n = this.cb?.count ?? 0;
        const mids = this.boxes.slice(0, n).map((b) => b.y + b.height / 2);
        if (n < 2 || mids.length < n || mids.some((m) => Number.isNaN(m))) return;
        const next = dragTarget(from, mids[from]! + g.dy, mids);
        if (next !== to) {
          to = next;
          void Haptics.selectionAsync();
          this.cb?.setDrag({ from, to, pitch: this.pitch() });
        }
      },
      onPanResponderRelease: () => finish(true),
      onPanResponderTerminate: () => finish(false),
    });
  }
}

export function GameResults({ session, nav }: { session: SessionState; nav: React.ReactNode }) {
  const { colors, isAccessibilitySize: ax } = useTheme();
  const insets = useSafeAreaInsets();
  const results = session.results!;
  const picks = results.picks;
  const [head, line] = HEADS[resultsHead(picks, results.mes)];
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState<Drag | null>(null);
  const rowNodes = useRef<(View | null)[]>([]);
  const addNode = useRef<View | null>(null);
  const input = useRef<TextInput>(null);
  const scroll = useRef<ScrollView>(null);
  // The list and the dock ride the keyboard (the dock sits on it while he types his words), as About you. Keyboard
  // events rather than KeyboardAvoidingView: the root needs no layout pass of its own.
  const [keyboard, setKeyboard] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardWillShow', (e) => setKeyboard(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardWillHide', () => setKeyboard(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // The field takes focus itself once it's on screen (autoFocus alone didn't hold on iOS, Nov 11).
  useEffect(() => {
    if (!session.editingWords) return;
    const id = setTimeout(() => {
      input.current?.focus();
      scroll.current?.scrollToEnd({ animated: true });
    }, 50);
    return () => clearTimeout(id);
  }, [session.editingWords]);

  const focusAfterRemove = (i: number, left: number) => {
    setTimeout(() => {
      const node = i < left ? rowNodes.current[i] : addNode.current;
      const tag = node ? findNodeHandle(node) : null;
      if (tag != null) AccessibilityInfo.setAccessibilityFocus(tag);
    }, 300);
  };

  const remove = async (i: number) => {
    const r = await removeFromResults(store, i);
    if (!r) return;
    showToast(t('game.results.removed', { name: styleLabel(r.removed) }), () => undoChange(store, r.token).then(() => undefined));
    focusAfterRemove(i, picks.length - 1);
  };
  const move = (from: number, to: number) => moveRow(picks, from, to);

  // A ref, not the state: two presses in one frame both see the state as it was (verify round 1, C4).
  const continuing = useRef(false);
  const onContinue = async () => {
    if (continuing.current) return;
    continuing.current = true;
    setBusy(true);
    try {
      await continueToAbout(store);
      router.push('/onboarding/basics');
    } catch {
      // A failed write (SG3.2): he stays here and Continue works again; nothing new is shown.
    } finally {
      continuing.current = false;
      setBusy(false);
    }
  };

  // The drag (a row's handle): the row follows the finger, the others make room, and it lands where dragTarget says.
  const [rows] = useState(() => new RowDrag());
  useEffect(() => {
    rows.update({ count: picks.length, move: (from, to) => void moveRow(picks, from, to), setDrag });
  }, [rows, picks]);
  const pitch = drag?.pitch ?? 0;
  const shiftOf = (i: number) => {
    if (!drag || i === drag.from) return 0;
    if (drag.from < drag.to && i > drag.from && i <= drag.to) return -pitch;
    if (drag.from > drag.to && i >= drag.to && i < drag.from) return pitch;
    return 0;
  };

  const words = session.words;
  const saved = !session.editingWords && words !== '';
  const ok = canContinue(picks, words) && !busy;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top, paddingBottom: keyboard }]}>
      {nav}
      <ScrollView ref={scroll} scrollEnabled={drag === null} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.title}>
          <KText testID="results-title" variant="largeTitle" accessibilityRole="header">
            {t(head)}
          </KText>
          <KText testID="results-line" variant="body" color="ink2">
            {t(line)}
          </KText>
        </View>
        {picks.length ? (
          <View testID="results-list" style={styles.list}>
            {picks.map((look, i) => (
              <ResultRow
                key={look}
                look={look}
                i={i}
                total={picks.length}
                ax={ax}
                lifted={drag?.from === i}
                shift={shiftOf(i)}
                dragY={rows.dragY}
                handlers={rows.handles[i]!.panHandlers}
                nodeRef={(n) => {
                  rowNodes.current[i] = n;
                }}
                onLayout={(b) => rows.setBox(i, b)}
                onRemove={() => void remove(i)}
                onMove={(to) => void move(i, to)}
              />
            ))}
          </View>
        ) : null}
        <Pressable
          ref={addNode}
          testID="results-add"
          onPress={() => router.push('/onboarding/add-look')}
          accessibilityRole="button"
          accessibilityLabel={t('game.results.add')}
          style={[styles.add, { borderColor: colors.inkFaint }]}
        >
          <Icon name="plus" size={16} color="ink2" weight="semibold" />
          <KText variant="body" weight="600" maxFontSizeMultiplier={CONTROL_TEXT_MAX_SCALE}>
            {t('game.results.add')}
          </KText>
        </Pressable>
        {session.editingWords ? (
          <View style={styles.words}>
            <TextInput
              ref={input}
              testID="results-words-input"
              value={words}
              onChangeText={setWords}
              placeholder={t('onb.looks.else.placeholder')}
              placeholderTextColor={colors.ink3}
              maxLength={80}
              returnKeyType="done"
              // Done saves and closes it. A blur doesn't: a blur right after it opened took it away (Nov 11).
              onSubmitEditing={() => void saveWords(store).catch(() => undefined)}
              accessibilityLabel={t('game.results.wordsA11y')}
              allowFontScaling
              maxFontSizeMultiplier={CONTROL_TEXT_MAX_SCALE}
              style={[styles.input, { color: colors.ink, backgroundColor: colors.surface, borderColor: colors.line }]}
            />
            <View testID="results-words-done" style={styles.end}>
              <CappedLink title={t('common.done')} onPress={() => void saveWords(store).catch(() => undefined)} />
            </View>
          </View>
        ) : saved ? (
          <View style={styles.savedRow}>
            <KText testID="results-words-saved" variant="body" color="ink2" style={styles.flex}>
              {t('game.results.wordsSaved', { words })}
            </KText>
            <View testID="results-words-edit">
              <CappedLink title={t('common.edit')} onPress={openWords} />
            </View>
          </View>
        ) : (
          <View testID="results-words-link" style={styles.link}>
            <CappedLink title={t('game.results.words')} onPress={openWords} />
          </View>
        )}
      </ScrollView>
      <View style={[styles.dock, { paddingBottom: keyboard ? space.s : Math.max(insets.bottom, space.l) }]}>
        <View testID="results-continue">
          <KButton title={t('onb.looks.continue')} size="large" disabled={!ok} onPress={() => void onContinue()} />
        </View>
        <View testID="results-play-again" style={styles.center}>
          <CappedLink title={t('game.results.playAgain')} onPress={() => void playAgain(store)} />
        </View>
      </View>
    </View>
  );
}

/** A text button whose label stops growing at 2× (SG9: button labels stop at CONTROL_TEXT_MAX_SCALE), as Continue's. */
function CappedLink({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title} style={({ pressed }) => [styles.capped, { opacity: pressed ? opacity.pressed : 1 }]}>
      <KText role="textLink" maxFontSizeMultiplier={CONTROL_TEXT_MAX_SCALE}>
        {title}
      </KText>
    </Pressable>
  );
}

function ResultRow({ look, i, total, ax, lifted, shift, dragY, handlers, nodeRef, onLayout, onRemove, onMove }: {
  look: StyleKey; i: number; total: number; ax: boolean; lifted: boolean; shift: number; dragY: Animated.Value;
  handlers: ReturnType<typeof PanResponder.create>['panHandlers'];
  nodeRef: (n: View | null) => void; onLayout: (b: RowBox) => void; onRemove: () => void; onMove: (to: number) => void;
}) {
  const { colors, scheme } = useTheme();
  const name = styleLabel(look);
  const line = lookLine({ style: look });
  const outfit = LOOKS.find((l) => l.style === look)!.outfits[0];
  const actions = [
    ...(i > 0 ? [{ name: 'moveUp', label: t('game.results.moveUp') }] : []),
    ...(i < total - 1 ? [{ name: 'moveDown', label: t('game.results.moveDown') }] : []),
    { name: 'remove', label: t('game.results.remove') },
  ];
  const drawing = (
    <View style={[styles.thumb, { backgroundColor: colors.surface2 }]}>
      <Outfit outfit={outfit} w={42} />
      <View testID={`results-row-${i}-number`} style={[styles.num, { backgroundColor: colors.ink }]}>
        <KText variant="caption" weight="700" color="onPrimary" tabular maxFontSizeMultiplier={1.3}>
          {String(i + 1)}
        </KText>
      </View>
    </View>
  );
  const text = (
    <View style={ax ? null : styles.flex}>
      <KText variant="body" weight="600">
        {name}
      </KText>
      <KText variant="footnote" color="ink3">
        {line}
      </KText>
    </View>
  );
  const controls = (
    <>
      <Pressable testID={`results-row-${i}-remove`} onPress={onRemove} accessibilityRole="button" accessibilityLabel={t('game.results.remove')} style={styles.hit}>
        <View style={[styles.x, { backgroundColor: colors.surface2 }]}>
          <Icon name="close" size={13} color="ink2" weight="bold" />
        </View>
      </Pressable>
      <View testID={`results-row-${i}-handle`} {...handlers} style={styles.hit}>
        <Icon name="line.3.horizontal" size={18} color="ink3" />
      </View>
    </>
  );
  const transform = lifted ? [{ translateY: dragY }] : shift ? [{ translateY: shift }] : [];
  return (
    <Animated.View
      ref={nodeRef}
      testID={`results-row-${i}`}
      accessible
      accessibilityLabel={t('game.results.rowA11y', { n: i + 1, total, name, line })}
      accessibilityActions={actions}
      onAccessibilityAction={(e) => {
        const a = e.nativeEvent.actionName;
        if (a === 'moveUp') onMove(i - 1);
        else if (a === 'moveDown') onMove(i + 1);
        else if (a === 'remove') onRemove();
      }}
      onLayout={(e) => onLayout({ y: e.nativeEvent.layout.y, height: e.nativeEvent.layout.height })}
      style={[
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.line, transform, zIndex: lifted ? 2 : 0 },
        lifted && scheme === 'light' ? { boxShadow: '0px 8px 24px rgba(18, 22, 40, 0.18)' } : null,
      ]}
    >
      {ax ? (
        <View style={styles.axCol}>
          <View style={styles.axTop}>
            {drawing}
            <View style={styles.flex} />
            {controls}
          </View>
          {text}
        </View>
      ) : (
        <View style={styles.rowInner}>
          {drawing}
          {text}
          {controls}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { paddingHorizontal: space.gutter, paddingTop: space.s, paddingBottom: space.xl, gap: space.m },
  title: { gap: space.xs, marginBottom: space.s },
  list: { gap: space.s },
  row: { borderWidth: 1, borderRadius: 18, borderCurve: 'continuous', padding: space.s },
  rowInner: { flexDirection: 'row', alignItems: 'center', gap: space.m },
  axCol: { flexDirection: 'column', gap: space.s },
  axTop: { flexDirection: 'row', alignItems: 'center', gap: space.s },
  thumb: { width: 58, alignItems: 'center', paddingVertical: space.xs, borderRadius: 12 },
  num: { position: 'absolute', top: -6, left: -6, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  hit: { width: size.hit, height: size.hit, alignItems: 'center', justifyContent: 'center' },
  x: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  add: { minHeight: size.buttonLarge, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 18, borderCurve: 'continuous', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.s },
  words: { gap: space.s },
  input: { borderWidth: 1, borderRadius: 22, borderCurve: 'continuous', minHeight: size.hit, paddingHorizontal: space.l, paddingVertical: space.s, fontSize: textStyles.body.fontSize },
  end: { alignItems: 'flex-end' },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: space.m, minHeight: size.hit },
  link: { minHeight: size.hit, justifyContent: 'center', alignItems: 'flex-start' },
  dock: { paddingHorizontal: space.gutter, paddingTop: space.s, gap: space.xs },
  center: { alignItems: 'center', minHeight: size.hit, justifyContent: 'center' },
  capped: { minHeight: size.hit, justifyContent: 'center' },
});

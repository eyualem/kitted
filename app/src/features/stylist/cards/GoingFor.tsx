// "Going for" (#215; mockups/going-for.html v2). Three pieces:
//  - GoingForInset: the question inside the reading card while it reads ("While I read it"), and again inside the
//    result after Change. His up-to-3 looks as compact drawn tiles plus Not sure; More holds the other looks and
//    Something else; "Headed: Everyday ⌄" grows into the occasion menu (MorphPicker, #69). A tap confirms in place:
//    nothing moves or folds while he's tapping.
//  - GoingForLine: the folded line at the top of the result, "Going for minimal · Everyday · Change" (a tag icon when
//    it was picked for him, a check when he chose it).
//  - GoingForAdviceBlock: what the answer changes under the score ("It reads that way too." / "Reads as streetwear.
//    For a minimal look, the graphic tee pulls the other way." + one move toward the look, no number).
// The inset and the line are flat sections of the card (no box inside the card), set off by the dashed Seam
// (03 §4.3). Copper is only for score movement (#231): the dot, the wash and Change are ink/neutral.
import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming, ZoomIn } from 'react-native-reanimated';
import type { GoingForAdvice } from '@kitted/core';
import { Icon, KText, MorphPicker, opacity, radius, Seam, size, space, useTheme } from '@/design-system';
import { OCCASIONS, type GoingForSource, type GoingForState, type OccasionKey, type StyleKey } from '@/data/types';
import { garmentHex } from '@/features/fitcheck/labels';
import { adviceText, asksLook, lineA11y, lookTiles, lookWord, noteText } from '@/features/fitcheck/goingFor';
import { PieceArt } from '@/features/closet/GarmentArt';
import { styleLabel } from '@/features/morning/copy';
import { lookLine, Outfit } from '@/features/onboarding/LookTile';
import { cleanOtherWords, LOOKS } from '@/features/onboarding/looks';
import { t } from '@/i18n/en';
import { occasionLabel } from '../thread';

/** The inset rises 22 pt into place on a settle-without-bounce spring while it fades in (Reanimated, 03 motion.inset). */
const insetEnter = () => {
  'worklet';
  return {
    initialValues: { opacity: 0, transform: [{ translateY: 22 }] },
    animations: {
      opacity: withTiming(1, { duration: 180 }),
      transform: [{ translateY: withSpring(0, { duration: 450, dampingRatio: 0.85 }) }],
    },
  };
};

const ELSE = '__else';
const NONE = '__none';
/** iOS drops an alert raised while the morph menu is still closing (#67 lesson). */
const MENU_DISMISS_MS = 450;

export interface GoingForInsetProps {
  where: 'wait' | 'result';
  look: StyleKey | null;
  /** He chose it (a check on the tile); false = the pre-pick stands (a plain border). */
  touched: boolean;
  source: GoingForSource;
  bothFromCard?: boolean;
  /** "Something else" words, if that was his answer. */
  other?: string | null;
  occasion: OccasionKey;
  /** His picks from setup, in order. */
  picks: readonly StyleKey[];
  onLook: (style: StyleKey | null, other?: string | null) => void;
  onOccasion: (o: OccasionKey) => void;
}

export function GoingForInset(p: GoingForInsetProps) {
  const { colors, a11y, isAccessibilitySize: ax } = useTheme();
  const { tiles, more } = lookTiles(p.picks);
  const asks = asksLook(p.occasion);
  const inMore = p.look !== null && !tiles.includes(p.look);
  const note = noteText({ where: p.where, look: p.look, touched: p.touched, source: p.source, bothFromCard: p.bothFromCard });
  const pick = (s: StyleKey | null) => {
    void Haptics.selectionAsync();
    p.onLook(s);
  };
  const askElse = () => {
    if (Platform.OS !== 'ios') return p.onLook(null, null);
    setTimeout(() => {
      Alert.prompt(t('gf.else.title'), t('gf.else.body'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('gf.else.save'), isPreferred: true, onPress: (v?: string) => p.onLook(null, cleanOtherWords(v ?? '')) },
      ], 'plain-text');
    }, MENU_DISMISS_MS);
  };
  const moreLabel = inMore ? styleLabel(p.look) : p.other ? t('gf.else') : t('gf.more');
  return (
    <Animated.View
      entering={p.where === 'wait' ? (a11y.reduceMotion ? FadeIn.duration(200) : insetEnter) : FadeIn.duration(200)}
    >
      {p.where === 'wait' ? <Seam /> : null}
      <View style={styles.inset}>
        {p.where === 'wait' ? (
          <View style={styles.label}>
            <View style={[styles.dot, { backgroundColor: colors.ink, boxShadow: `0px 0px 0px 3px ${colors.surface2}` }]} />
            <KText variant="footnote" color="ink2" mono="label">
              {t('gf.label')}
            </KText>
          </View>
        ) : null}
        {asks ? (
          <>
            <View style={ax ? styles.qCol : styles.qRow}>
              <KText variant="callout" weight="600" style={ax ? null : { flexShrink: 1 }} accessibilityRole="header">
                {t('gf.q')}
              </KText>
              <MorphPicker
                label={moreLabel}
                value={inMore ? (p.look as string) : p.other ? ELSE : NONE}
                sections={[
                  { title: t('gf.more.section'), options: more.map((s) => ({ value: s as string, label: styleLabel(s) })) },
                  { options: [{ value: ELSE, label: t('gf.else') }] },
                ]}
                onPick={(v) => (v === ELSE ? askElse() : pick(v as StyleKey))}
                accessibilityLabel={t('gf.more.a11y')}
              />
            </View>
            <View style={ax ? styles.tilesCol : styles.tilesRow} accessibilityRole="radiogroup">
              {tiles.map((s) => (
                <LookChip key={s} look={s} selected={p.look === s && !p.other} chosen={p.look === s && p.touched} ax={ax} onPress={() => pick(s)} />
              ))}
              <LookChip look={null} selected={p.look === null && !p.other} chosen={p.look === null && !p.other && p.touched} ax={ax} onPress={() => pick(null)} />
            </View>
          </>
        ) : null}
        <View style={[styles.headed, { borderTopColor: asks ? colors.line : 'transparent' }]}>
          <MorphPicker
            prefix={t('gf.headed')}
            label={occasionLabel(p.occasion)}
            value={p.occasion}
            sections={[{ options: OCCASIONS.map((o) => ({ value: o, label: occasionLabel(o) })) }]}
            onPick={p.onOccasion}
            accessibilityLabel={t('gf.headed.a11y', { occasion: occasionLabel(p.occasion) })}
          />
        </View>
        {asks || p.where === 'result' ? (
          <Animated.View key={note.lead} entering={a11y.reduceMotion ? undefined : FadeIn.duration(180)} style={styles.note}>
            {/* Green only on the check icon; the sentence is ink (#231). */}
            {note.tone === 'good' ? (
              <View style={styles.noteIcon}>
                <Icon name="check" size={12} color="good" weight="bold" scalesWithText />
              </View>
            ) : null}
            <KText variant="footnote" color="ink2" style={{ flex: 1 }}>
              <KText variant="footnote" weight="600" color="ink">
                {note.lead}
              </KText>
              {note.tail ? ` ${note.tail}` : ''}
            </KText>
          </Animated.View>
        ) : null}
      </View>
      {p.where === 'result' ? <Seam /> : null}
    </Animated.View>
  );
}

/** One compact look tile (a row at accessibility sizes): the look's drawn outfits and its name. */
function LookChip({ look, selected, chosen, ax, onPress }: { look: StyleKey | null; selected: boolean; chosen: boolean; ax: boolean; onPress: () => void }) {
  const { colors, a11y } = useTheme();
  const L = look ? LOOKS.find((l) => l.style === look) : undefined;
  const name = look ? styleLabel(look) : t('gf.notSure');
  const label = L ? t('gf.tile.a11y', { style: name, line: lookLine(L) }) : t('gf.notSure.a11y');
  const check = (
    <Animated.View
      entering={a11y.reduceMotion ? undefined : ZoomIn.springify().duration(250)}
      style={[ax ? styles.ckStatic : styles.ck, { backgroundColor: colors.ink, borderColor: colors.surface }]}
    >
      <Icon name="check" size={ax ? 16 : 12} color={colors.surface} weight="bold" />
    </Animated.View>
  );
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected, checked: selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        ax ? styles.chipRow : styles.chip,
        {
          backgroundColor: colors.surface, borderColor: selected ? colors.ink : colors.line, borderWidth: selected ? 2 : 1,
          padding: selected ? 3 : 4, opacity: pressed ? opacity.pressed : 1,
        },
      ]}
    >
      <View style={[ax ? styles.artAx : styles.art, { backgroundColor: colors.surface2 }, L ? null : styles.artCenter]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {L ? (
          ax ? <Outfit outfit={L.outfits[0]} w={25} /> : (
            <>
              <Outfit outfit={L.outfits[0]} w={20} />
              <Outfit outfit={L.outfits[1]} w={20} />
            </>
          )
        ) : (
          <Icon name="question" size={ax ? 26 : 24} color="ink2" />
        )}
      </View>
      <KText
        variant="footnote"
        weight="600"
        style={ax ? { flex: 1 } : { textAlign: 'center', paddingHorizontal: space.xxs }}
        // Equal-width tiles: a two-word name ("Smart casual") takes a second line rather than widening
        // its tile; a one-word name ("Streetwear") stays on one line and shrinks, so it never splits mid-word.
        numberOfLines={ax ? undefined : name.includes(' ') ? 2 : 1}
        adjustsFontSizeToFit={!ax}
        minimumFontScale={0.75}
      >
        {name}
      </KText>
      {chosen ? check : null}
    </Pressable>
  );
}

/** The folded line at the top of the result: "Going for minimal · Everyday" and Change (44 × 44). */
export function GoingForLine({ g, occasion, onChange }: { g: GoingForState; occasion: OccasionKey; onChange: () => void }) {
  const { isAccessibilitySize: ax } = useTheme();
  const occ = occasionLabel(occasion);
  const lounge = !asksLook(occasion);
  return (
    <Animated.View entering={FadeIn.duration(200)}>
      <View style={[styles.line, ax ? styles.lineAx : null]} accessibilityLabel={lounge ? t('gf.line.headed', { occasion: occ }) : lineA11y(g, occ)}>
        <View style={{ flexDirection: 'row', alignItems: ax ? 'flex-start' : 'center', gap: space.s, flex: 1, minWidth: 0 }}>
          {!lounge ? (
            <View style={ax ? { paddingTop: space.s } : null}>
              <Icon name={g.confirmed ? 'check' : 'tag'} size="small" color={g.confirmed ? 'good' : 'ink2'} weight="semibold" scalesWithText />
            </View>
          ) : null}
          <KText variant="subheadline" style={{ flex: 1, paddingVertical: space.xs }}>
            {lounge ? (
              t('gf.line.headed', { occasion: occ })
            ) : g.style ? (
              <>
                {`${t('gf.line.lead')} `}
                <KText variant="subheadline" weight="700">
                  {lookWord(g.style).replace(/ /g, '\u00a0')}
                </KText>
              </>
            ) : (
              t('gf.line.none')
            )}
            {lounge ? null : (
              <KText variant="subheadline" color="ink2">
                {ax ? `\n${occ}` : ` \u00b7\u00a0${occ.replace(/ /g, '\u00a0')}`}
              </KText>
            )}
          </KText>
        </View>
        {/* TextLink's look (ink, #231) by hand: TextLink can't take the longer VoiceOver label. */}
        <Pressable
          onPress={onChange}
          accessibilityRole="button"
          accessibilityLabel={t('gf.change.a11y')}
          style={({ pressed }) => [styles.change, ax ? { alignSelf: 'flex-end' } : null, { opacity: pressed ? opacity.pressed : 1 }]}
        >
          <KText role="textLink" color="ink">
            {t('gf.change')}
          </KText>
        </Pressable>
      </View>
      <Seam />
    </Animated.View>
  );
}

/** Under the score: the match line, or the reads-as sentence and one move toward the look. `flash` bumps when a new look
 *  rewrote it (a neutral wash that fades; copper is only for score movement, #231; VoiceOver hears "Tips updated for smart casual."). */
export function GoingForAdviceBlock({ advice, flash, moveIsFix }: { advice: GoingForAdvice; flash: number; moveIsFix: number | null }) {
  const { colors } = useTheme();
  const a = adviceText(advice, moveIsFix);
  const wash = useSharedValue(0);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    wash.set(1);
    wash.set(withDelay(500, withTiming(0, { duration: 700 })));
    AccessibilityInfo.announceForAccessibility?.(advice.going ? t('gf.adv.updated', { style: lookWord(advice.going) }) : t('gf.adv.updatedNone'));
  }, [flash, wash, advice.going]);
  const washStyle = useAnimatedStyle(() => ({ opacity: wash.value }));
  const move = advice.move;
  return (
    <View style={styles.adv}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.wash, { backgroundColor: colors.surface2 }, washStyle]} />
      {a.kind === 'match' ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s }}>
          <Icon name="check" size="small" color="good" weight="semibold" scalesWithText />
          <KText variant="subheadline" weight="600" color="ink" style={{ flex: 1 }}>
            {a.lead}
          </KText>
        </View>
      ) : (
        <KText variant="callout">
          {a.lead}
          {a.rest ? (
            <KText variant="callout" color="ink2">
              {` ${a.rest}`}
            </KText>
          ) : null}
        </KText>
      )}
      {a.move && move ? (
        <View style={styles.move}>
          <View style={[styles.moveArt, { backgroundColor: colors.surface2 }]}>
            <PieceArt item={{ garment: move.garment, hex: garmentHex(move.garment) }} size={36} />
          </View>
          <View style={{ flex: 1, gap: 1 }}>
            <KText role="fixTitle">{a.move.title}</KText>
            <KText variant="footnote" color="ink3">
              {a.move.detail}
            </KText>
          </View>
        </View>
      ) : null}
    </View>
  );
}

/** The card's VoiceOver words for the advice (the result card is one element). */
export function adviceA11y(advice: GoingForAdvice | null | undefined, moveIsFix: number | null = null): string {
  if (!advice) return '';
  const a = adviceText(advice, moveIsFix);
  return [a.lead, a.rest, a.move ? `${a.move.title}. ${a.move.detail}.` : ''].filter(Boolean).join(' ');
}

const styles = StyleSheet.create({
  // A flat section of the card, at the card's own insets (the Seam sets it off).
  inset: { paddingHorizontal: space.cardPadH, paddingTop: space.l, paddingBottom: space.xs, gap: space.s },
  label: { flexDirection: 'row', alignItems: 'center', gap: space.s, minHeight: space.l },
  dot: { width: 8, height: 8, borderRadius: 4 },
  qRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.s, minHeight: 32 },
  qCol: { gap: space.s, alignItems: 'flex-start' },
  tilesRow: { flexDirection: 'row', gap: space.s },
  tilesCol: { gap: space.s },
  // Equal columns: every tile gets the same share of the row, whatever its name's length.
  chip: { flex: 1, flexBasis: 0, minWidth: 0, minHeight: size.hit, borderRadius: 14, borderCurve: 'continuous', gap: space.xs },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: space.m, minHeight: 68, borderRadius: 14, borderCurve: 'continuous', paddingRight: space.m },
  art: { height: 50, borderRadius: 10, borderCurve: 'continuous', flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', gap: space.xxs, paddingTop: space.xxs, overflow: 'hidden' },
  artAx: { width: 56, height: 56, borderRadius: 10, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  artCenter: { alignItems: 'center', justifyContent: 'center', paddingTop: 0 },
  ck: { position: 'absolute', top: -7, right: -7, width: 21, height: 21, borderRadius: 10.5, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  ckStatic: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headed: { borderTopWidth: 1, minHeight: size.hit, justifyContent: 'center' },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: space.xs, paddingBottom: space.s, marginTop: -space.xs },
  noteIcon: { paddingTop: 3 },
  line: { minHeight: size.hit, flexDirection: 'row', alignItems: 'center', paddingLeft: space.cardPadH, paddingTop: space.s, paddingBottom: space.xs },
  lineAx: { flexDirection: 'column', alignItems: 'stretch' },
  change: { minHeight: size.hit, minWidth: size.hit, paddingLeft: space.s, paddingRight: space.cardPadH, alignItems: 'center', justifyContent: 'center' },
  adv: { gap: space.xxs, paddingTop: space.m, paddingBottom: space.s },
  wash: { marginHorizontal: -space.s, marginVertical: -space.xxs, borderRadius: radius.thumb },
  move: { flexDirection: 'row', alignItems: 'center', gap: space.m, paddingTop: space.s },
  moveArt: { width: 44, height: 44, borderRadius: radius.thumb, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center' },
});

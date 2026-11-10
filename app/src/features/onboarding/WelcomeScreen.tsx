// O1 · Welcome (02 D1; T38, tasks/T38/DESIGN.md): an outfit drawn by Closet's code from the bundled s14 reading (no
// photo of anyone), a mini score card that plays the engine's top fix once (7.5 "Put together" → 8.0 "Sharp", the
// sneakers swapped), the wordmark, the headline, Get started, "See an example check" (O1e, #289) and, once accounts
// exist, "I already have an account" (A1 from Welcome, 10-onboarding.md §2; hidden in real builds until Firebase).
// Every number and word on the card comes from welcomeExample (the engine), and nothing is stored or sent until Get
// started. One scroll view holds the hero group and the bottom block, laid out by welcomeLayout so it fits every phone
// and scrolls rather than overlaps. The status bar follows the theme (it was forced dark for the old light photo).
import { router } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  KButton,
  KCard,
  TextLink,
  KText,
  MonoLabel,
  Numeral,
  radius,
  space,
  useTheme,
  WovenLabel,
} from "@/design-system";
import { store } from "@/data/db";
import { t } from "@/i18n/en";
import { useAccountsOn } from "@/features/account/account";
import { DrawnOutfit } from "./DrawnOutfit";
import { drawnPieces } from "./outfitDrawing";
import { useWelcomeSwap } from "./useWelcomeSwap";
import {
  welcomeAfterFrame,
  welcomeCardA11y,
  welcomeExample,
  welcomeLayout,
  type WelcomeExample,
  type WelcomeSwapFrame,
} from "./welcomeExample";
import { ONBOARDING_STEP_KEY } from "./resume";

const EXAMPLE = welcomeExample();
const PIECES = EXAMPLE ? drawnPieces(EXAMPLE.reading) : [];
const AFTER_PIECE = EXAMPLE
  ? (drawnPieces(EXAMPLE.afterReading).find((p) => p.slot === EXAMPLE.swapSlot) ?? null)
  : null;
const CARD_A11Y = EXAMPLE ? welcomeCardA11y(EXAMPLE) : "";
/** Until measured: the bottom block and the after-state card on the iPhone 17 Pro at the default size. */
const BOTTOM_ESTIMATE = 387;
const CARD_ESTIMATE = 136;

export function WelcomeScreen() {
  const { colors, isAccessibilitySize, a11y } = useTheme();
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  // His screen's own size (the web preview's phone frame is smaller than the window).
  const [box, setBox] = useState<{ width: number; height: number } | null>(null);
  const [bottomH, setBottomH] = useState<number | null>(null);
  const [cardH, setCardH] = useState<number | null>(null);
  /** The detail line's height before ("Full check", measured on the card at rest) and after (the fix, measured on the
   *  invisible after-state copy), so the card can grow between them during the cross-fade. */
  const [detailH, setDetailH] = useState<{ before: number | null; after: number | null }>({ before: null, after: null });
  const noteDetail = (which: "before" | "after", h: number) =>
    setDetailH((d) => (d[which] !== null && Math.abs(d[which] - h) <= 0.5 ? d : { ...d, [which]: h }));
  const { width, height } = box ?? window;
  const frame = useWelcomeSwap(EXAMPLE, { reduceMotion: a11y.reduceMotion, accessibilitySize: isAccessibilitySize });
  const accounts = useAccountsOn();
  const bottomBlockHeight = bottomH ?? BOTTOM_ESTIMATE;
  const layout = welcomeLayout({
    width,
    height,
    safeTop: insets.top,
    bottomBlockHeight,
    cardAfterHeight: cardH ?? CARD_ESTIMATE,
    accessibilitySize: isAccessibilitySize,
  });
  const bottomTop = EXAMPLE ? layout.bottomBlockTop : Math.max(insets.top + 24, height - bottomBlockHeight);
  const cardPlace = isAccessibilitySize
    ? { top: layout.card.top, left: space.heroGutter, right: space.heroGutter }
    : { top: layout.card.top, right: layout.card.right, width: layout.card.width ?? undefined };
  const start = () => {
    void store.setKv(ONBOARDING_STEP_KEY, "looks");
    router.push("/onboarding/looks");
  };
  const keep = (set: (n: number) => void, was: number | null) => (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (was === null || Math.abs(h - was) > 0.5) set(h);
  };
  return (
    <ScrollView
      testID="welcome-root"
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ minHeight: height }}
      bounces={false}
      onLayout={(e) => {
        const { width: w, height: h } = e.nativeEvent.layout;
        setBox((b) => (b && b.width === w && b.height === h ? b : { width: w, height: h }));
      }}
    >
      {EXAMPLE && frame ? (
        <>
          <View style={{ position: "absolute", left: layout.drawing.left, top: layout.drawing.top }}>
            <DrawnOutfit
              testID="welcome-drawing"
              pieces={PIECES}
              layout={{ kind: "welcome", k: layout.k }}
              swap={AFTER_PIECE ? { piece: AFTER_PIECE, opacity: frame.pieceAfter } : null}
            />
          </View>
          {/* The card's after state, invisible, only to measure its height: its top is set from it, so it never
              moves during the swap and grows downward. */}
          <View
            style={[styles.measure, cardPlace]}
            testID="welcome-card-measure"
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            onLayout={keep(setCardH, cardH)}
          >
            <MiniCard
              ex={EXAMPLE}
              frame={welcomeAfterFrame(EXAMPLE)}
              ax={isAccessibilitySize}
              measure
              detailH={detailH}
              onDetail={noteDetail}
            />
          </View>
          <View
            testID="welcome-card"
            accessible
            accessibilityLabel={CARD_A11Y}
            style={[{ position: "absolute" }, cardPlace]}
          >
            <MiniCard ex={EXAMPLE} frame={frame} ax={isAccessibilitySize} detailH={detailH} onDetail={noteDetail} />
          </View>
        </>
      ) : null}
      <View
        testID="welcome-bottom"
        onLayout={keep(setBottomH, bottomH)}
        style={[
          styles.bottom,
          { marginTop: bottomTop, paddingBottom: Math.max(insets.bottom, 10) + 10 },
        ]}
      >
        <View style={{ alignSelf: "flex-start" }}>
          <WovenLabel size="small" />
        </View>
        <KText variant="largeTitle" weight="700" accessibilityRole="header">
          {t("onb.welcome.title")}
        </KText>
        <KText variant="body" color="ink2">
          {t("onb.welcome.body")}
        </KText>
        <View style={{ marginTop: 8, gap: 2 }}>
          <KButton title={t("onb.welcome.start")} onPress={start} />
          <KButton
            title={t("onb.welcome.example")}
            kind="ghost"
            onPress={() => router.push("/onboarding/example")}
          />
          {accounts ? (
            <View style={{ alignItems: "center" }}>
              <TextLink
                title={t("onb.welcome.haveAccount")}
                color="ink2"
                onPress={() => router.push({ pathname: "/sheets/sign-in", params: { from: "welcome" } })}
              />
            </View>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

/** The mini card in one frame of the swap. Before and after layers of the word and the detail line exist together
 *  only during their 200 ms cross-fade; at rest only one of each is rendered. Nothing is cut to a line count: the word
 *  and the fix wrap and the card grows downward. `measure`: the invisible after-state copy (no testIDs). */
function MiniCard({
  ex,
  frame,
  ax,
  measure,
  detailH,
  onDetail,
}: {
  ex: WelcomeExample;
  frame: WelcomeSwapFrame;
  ax: boolean;
  measure?: boolean;
  detailH: { before: number | null; after: number | null };
  onDetail: (which: "before" | "after", h: number) => void;
}) {
  const { before: beforeH, after: afterH } = detailH;
  const after = frame.textAfter;
  const fading = after > 0 && after < 1;
  const id = (s: string) => (measure ? undefined : `welcome-card-${s}`);
  // During the cross-fade the detail line's box grows from the before line's height to the after line's (both
  // measured at rest); unmeasured, it takes the after line's height at once.
  const both = fading && beforeH !== null && afterH !== null;
  const detailBox = both ? { height: beforeH + (afterH - beforeH) * after } : null;
  return (
    <KCard radius={radius.cardSmall}>
      <View style={[styles.miniCard, ax ? styles.miniCardAx : null]}>
        <View style={ax ? styles.tagColumn : styles.tagRow}>
          <MonoLabel>{t("onb.welcome.cardTag")}</MonoLabel>
          <MonoLabel>{t("onb.welcome.cardOccasion")}</MonoLabel>
        </View>
        <View style={ax ? styles.scoreColumn : styles.scoreRow}>
          <View testID={id("score")}>
            <Numeral size={52} style={{ fontVariant: ["tabular-nums"] }}>
              {frame.numeral}
            </Numeral>
          </View>
          <View style={styles.word}>
            {after < 1 ? (
              <View testID={id("word-before")} style={[after === 0 ? null : styles.wordLayer, { opacity: 1 - after }]}>
                <KText variant="subheadline" weight="600">
                  {ex.word}
                </KText>
              </View>
            ) : null}
            {after > 0 ? (
              <View testID={id("word-after")} style={{ opacity: after }}>
                <KText variant="subheadline" weight="600">
                  {ex.after.word}
                </KText>
              </View>
            ) : null}
          </View>
        </View>
        <View style={detailBox}>
          {after < 1 ? (
            <View
              testID={id("detail-before")}
              style={[after === 0 ? null : styles.detailLayer, { opacity: 1 - after }]}
              onLayout={after === 0 && !measure ? (e) => onDetail("before", e.nativeEvent.layout.height) : undefined}
            >
              <KText variant="caption" color="ink2">
                {t("onb.welcome.cardDetail")}
              </KText>
            </View>
          ) : null}
          {after > 0 ? (
            <View
              testID={id("detail-after")}
              style={[both ? styles.detailLayer : null, { opacity: after }]}
              onLayout={after === 1 && measure ? (e) => onDetail("after", e.nativeEvent.layout.height) : undefined}
            >
              <KText variant="caption" color="ink2">
                {ex.fix.copy}
              </KText>
            </View>
          ) : null}
        </View>
      </View>
    </KCard>
  );
}

const styles = StyleSheet.create({
  measure: { position: "absolute", opacity: 0 },
  miniCard: { paddingVertical: space.m, paddingHorizontal: space.m, gap: space.s },
  miniCardAx: { paddingHorizontal: 14 },
  tagRow: { flexDirection: "row", justifyContent: "space-between", gap: space.s },
  tagColumn: { gap: space.xs },
  scoreRow: { flexDirection: "row", alignItems: "flex-end", gap: space.m },
  scoreColumn: { alignItems: "flex-start", gap: space.xs },
  word: { flexShrink: 1 },
  /** The fading word over the one in flow, on the score row's bottom line (its own width: it never re-wraps). */
  wordLayer: { position: "absolute", left: 0, bottom: 0 },
  /** The fading detail line, at the card's text width, from the line's top. */
  detailLayer: { position: "absolute", left: 0, right: 0, top: 0 },
  // No fixed lineHeight/letterSpacing on SF text (03 §3.1): Dynamic Type sets both, so lines can't overlap.
  bottom: { paddingHorizontal: space.heroGutter, gap: space.l },
});

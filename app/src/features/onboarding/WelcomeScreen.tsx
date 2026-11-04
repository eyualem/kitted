// O1 · Welcome (02 D1): the example check played once (10-onboarding.md §14, #388: the drawn outfit, the card reading
// it, the score, the fix and the closet line; WelcomeHero.tsx), the wordmark, the headline that says what Kitted does,
// Get started, "See an example check" (O1e, #289) and, once accounts exist, "I already have an account" (A1 from
// Welcome, 10-onboarding.md §2; hidden in real builds until Firebase, ACCOUNTS_BUILT).
// The card's score, word and fix come from the engine (welcomeExample), and nothing on it is a photo (#388).
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KButton, TextLink, KText, space, useTheme, WovenLabel } from "@/design-system";
import { store } from "@/data/db";
import { t } from "@/i18n/en";
import { useAccountsOn } from "@/features/account/account";
import { welcomeExample } from "./welcomeExample";
import { useWelcomePlay, WelcomeCard, WelcomeOutfit } from "./WelcomeHero";
import { ONBOARDING_STEP_KEY } from "./resume";

const EXAMPLE = welcomeExample();
/** The hero never squeezes below this (a short phone scrolls instead). */
const HERO_MIN = 330;

export function WelcomeScreen() {
  const { colors, isAccessibilitySize } = useTheme();
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  // His screen's own width (the web preview's phone frame is narrower than the window), and the hero's height.
  const [width, setWidth] = useState<number | null>(null);
  const [heroH, setHeroH] = useState<number | null>(null);
  const w = width ?? window.width;
  const play = useWelcomePlay();
  const accounts = useAccountsOn();
  const start = () => {
    void store.setKv(ONBOARDING_STEP_KEY, "looks");
    router.push("/onboarding/looks");
  };

  // The drawing on the left, the card overlapping it on the right (the mockup's B, #388).
  const top = insets.top + space.s;
  const tileW = Math.round(w * 0.46);
  const tileH = heroH ? Math.max(0, heroH - top - space.l) : 0;
  const cardW = Math.min(214, w - tileW - space.xl - 16 + 18);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        {EXAMPLE && !isAccessibilitySize ? (
          <View
            style={{ flex: 1, minHeight: HERO_MIN }}
            onLayout={(e) => setHeroH(e.nativeEvent.layout.height)}
            onTouchEnd={play.skip}
            testID="welcome-hero"
          >
            {tileH > 0 ? (
              <>
                <View style={{ position: "absolute", left: space.xl, top }}>
                  <WelcomeOutfit pieces={EXAMPLE.pieces} width={tileW} height={tileH} chip={{ t: play.t }} />
                </View>
                <View style={{ position: "absolute", right: 16, top: top + Math.round(tileH * 0.16) }}>
                  <WelcomeCard ex={EXAMPLE} width={cardW} t={play.t} />
                </View>
              </>
            ) : null}
          </View>
        ) : null}
        {/* The largest text sizes: the card alone, full width (the drawing would leave it no room). */}
        {EXAMPLE && isAccessibilitySize ? (
          <View style={{ paddingTop: insets.top + space.l, paddingHorizontal: space.heroGutter }} onTouchEnd={play.skip}>
            <WelcomeCard ex={EXAMPLE} width={w - 2 * space.heroGutter} t={play.t} />
          </View>
        ) : null}
        <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 10) + 10, paddingTop: isAccessibilitySize ? space.xl : space.m }]}>
          <View style={{ alignSelf: "flex-start" }}>
            <WovenLabel size="small" />
          </View>
          <KText variant="largeTitle" weight="700" accessibilityRole="header">
            {/* The deck's line breaks set the three lines at normal sizes; at the largest sizes they'd strand a word. */}
            {isAccessibilitySize ? t("onb.welcome.title").replace(/\n/g, " ") : t("onb.welcome.title")}
          </KText>
          <KText variant="body" color="ink2">
            {t("onb.welcome.body")}
          </KText>
          <View style={{ marginTop: 8, gap: 2 }}>
            <KButton title={t("onb.welcome.start")} onPress={start} />
            <KButton title={t("onb.welcome.example")} kind="ghost" onPress={() => router.push("/onboarding/example")} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  // No fixed lineHeight/letterSpacing on SF text (03 §3.1): Dynamic Type sets both, so lines can't overlap.
  bottom: { paddingHorizontal: space.heroGutter, gap: space.l },
});

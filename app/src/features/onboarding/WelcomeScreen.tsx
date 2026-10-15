// O1 · Welcome (02 D1): the hero photo (s15, neck down), a mini score card, the wordmark, the headline and
// Get started. "See an example check" (O1e) isn't built yet, so its link is hidden rather than leading nowhere.
// The card's score and word come from the engine (welcomeExample, #276), and the hero starts below the collar.
import { router, useFocusEffect } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import {
  KButton,
  KCard,
  KText,
  MonoLabel,
  Numeral,
  radius,
  space,
  useTheme,
  WovenLabel,
} from "@/design-system";
import { NeckDownPhoto } from "@/design-system/components/Chat";
import { demoPhoto } from "@/demo/demoPhotos";
import { displayScore } from "@/design-system/score";
import { store } from "@/data/db";
import { KV } from "@/data/store";
import { t } from "@/i18n/en";
import { WELCOME_PHOTO, welcomeExample } from "./welcomeExample";

const HERO_H = 455;
/** s15's stored neck line (0.235 of the photo) sits on his beard; the hero starts below the collar, so nothing of
 *  the face shows (#276). Judged on the bundled 656 × 820 file: the beard ends near 0.28. */
const HERO_NECK = 0.3;
const EXAMPLE = welcomeExample();

export function WelcomeScreen() {
  const { colors, isAccessibilitySize, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  // The hero is a light photo in either theme, so the clock and battery go dark while Welcome is on screen; the
  // theme's style comes back when he moves on (#276).
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle("dark", true);
      return () => setStatusBarStyle(scheme === "dark" ? "light" : "dark", true);
    }, [scheme]),
  );
  const window = useWindowDimensions();
  // His screen's own size (the web preview's phone frame is smaller than the window).
  const [box, setBox] = useState<{ width: number; height: number } | null>(
    null,
  );
  const { width, height } = box ?? window;
  const hero = demoPhoto(WELCOME_PHOTO);
  const heroH = isAccessibilitySize ? Math.round(height * 0.4) : HERO_H;
  const start = () => {
    void store.setKv(KV.onboardingStep, "1");
    router.push("/onboarding/looks");
  };
  return (
    <View
      style={[styles.root, { backgroundColor: colors.bg }]}
      onLayout={(e) =>
        setBox({
          width: e.nativeEvent.layout.width,
          height: e.nativeEvent.layout.height,
        })
      }
    >
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: heroH,
        }}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {hero ? (
          <NeckDownPhoto
            source={hero.source}
            aspect={hero.aspect}
            crop={hero.crop ? { ...hero.crop, neck: Math.max(hero.crop.neck, HERO_NECK) } : hero.crop}
            width={width}
            height={heroH}
          />
        ) : null}
        <Svg style={StyleSheet.absoluteFill} width={width} height={heroH}>
          <Defs>
            <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
              <Stop
                offset={208 / HERO_H}
                stopColor={colors.bg}
                stopOpacity={0}
              />
              <Stop offset={1} stopColor={colors.bg} stopOpacity={1} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={width} height={heroH} fill="url(#fade)" />
        </Svg>
      </View>
      {!isAccessibilitySize && EXAMPLE ? (
        <View
          style={[styles.mini, { top: 125 }]}
          accessible
          accessibilityLabel={`Example fit check. ${t("onb.welcome.cardOccasion")}. ${displayScore(EXAMPLE.score)} out of 10, ${EXAMPLE.word}. ${t("onb.welcome.cardDetail")}.`}
        >
          <KCard radius={radius.cardSmall}>
            <View style={styles.miniCard}>
              <View style={styles.tagRow}>
                <MonoLabel>{t("onb.welcome.cardTag")}</MonoLabel>
                <MonoLabel>{t("onb.welcome.cardOccasion")}</MonoLabel>
              </View>
              <View style={styles.scoreRow}>
                <Numeral size={52}>{displayScore(EXAMPLE.score)}</Numeral>
                <View>
                  <KText variant="subheadline" weight="600">
                    {EXAMPLE.word}
                  </KText>
                  <KText variant="caption" color="ink2">
                    {t("onb.welcome.cardDetail")}
                  </KText>
                </View>
              </View>
            </View>
          </KCard>
        </View>
      ) : null}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "flex-end",
          paddingTop: heroH - 40,
        }}
        bounces={false}
      >
        <View
          style={[
            styles.bottom,
            { paddingBottom: Math.max(insets.bottom, 10) + 10 },
          ]}
        >
          <View style={{ alignSelf: "flex-start" }}>
            <WovenLabel size="small" />
          </View>
          <KText
            variant="largeTitle"
            weight="700"
            accessibilityRole="header"
          >
            {t("onb.welcome.title")}
          </KText>
          <KText variant="body" color="ink2">
            {t("onb.welcome.body")}
          </KText>
          <View style={{ marginTop: 8 }}>
            <KButton title={t("onb.welcome.start")} onPress={start} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  // Sized by its content: "Put together" is wider than "Sharp", and a fixed width clipped the score (#276).
  mini: { position: "absolute", right: space.xl, minWidth: 172 },
  miniCard: { paddingVertical: space.m, paddingHorizontal: space.m, gap: space.s },
  tagRow: { flexDirection: "row", justifyContent: "space-between", gap: space.s },
  scoreRow: { flexDirection: "row", alignItems: "flex-end", gap: space.m },
  // No fixed lineHeight/letterSpacing on SF text (03 §3.1): Dynamic Type sets both, so lines can't overlap.
  bottom: { paddingHorizontal: space.heroGutter, gap: space.l },
});

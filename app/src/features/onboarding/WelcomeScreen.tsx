// O1 · Welcome (02 D1): the hero photo (s15, neck down), a mini score card, the wordmark, the headline and
// Get started. "See an example check" (O1e) isn't built yet, so its link is hidden rather than leading nowhere.
import { router } from "expo-router";
import { useState } from "react";
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
import { store } from "@/data/db";
import { KV } from "@/data/store";
import { t } from "@/i18n/en";

const HERO_H = 455;

export function WelcomeScreen() {
  const { colors, isAccessibilitySize } = useTheme();
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  // His screen's own size (the web preview's phone frame is smaller than the window).
  const [box, setBox] = useState<{ width: number; height: number } | null>(
    null,
  );
  const { width, height } = box ?? window;
  const hero = demoPhoto("s15");
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
            crop={hero.crop}
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
      {!isAccessibilitySize ? (
        <View
          style={[styles.mini, { top: 125 }]}
          accessible
          accessibilityLabel={`Example fit check. ${t("onb.welcome.cardOccasion")}. 8.5 out of 10, ${t("onb.welcome.cardWord")}. ${t("onb.welcome.cardDetail")}.`}
        >
          <KCard radius={radius.cardSmall}>
            <View style={styles.miniCard}>
              <View style={styles.tagRow}>
                <MonoLabel>{t("onb.welcome.cardTag")}</MonoLabel>
                <MonoLabel>{t("onb.welcome.cardOccasion")}</MonoLabel>
              </View>
              <View style={styles.scoreRow}>
                <Numeral size={52}>8.5</Numeral>
                <View>
                  <KText variant="subheadline" weight="600">
                    {t("onb.welcome.cardWord")}
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
  mini: { position: "absolute", right: space.xl, width: 172 },
  miniCard: { paddingVertical: space.m, paddingHorizontal: space.m, gap: space.s },
  tagRow: { flexDirection: "row", justifyContent: "space-between", gap: space.s },
  scoreRow: { flexDirection: "row", alignItems: "flex-end", gap: space.m },
  // No fixed lineHeight/letterSpacing on SF text (03 §3.1): Dynamic Type sets both, so lines can't overlap.
  bottom: { paddingHorizontal: space.heroGutter, gap: space.l },
});

// Root: providers, the gate (02 §1.1, 06 §8) and every modal and sheet route, so only one
// modal shows at a time. Order of guards: age stop → onboarding → tabs.
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform, View } from 'react-native';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavThemeProvider, router, type Theme as NavigationTheme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaFrameContext, SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { ThemeProvider, setAppAppearance, useTheme } from '@/design-system';
import { DEMO_ENABLED } from '@/demo/config';
import { ToastHost } from '@/features/toast/ToastHost';
import { useDemoState } from '@/demo/demoState';
import { useGate } from '@/state/appGate';
import { boot } from '@/state/boot';
import { getDemoArgs } from '@/state/session';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Sheet presentation (06 §2). Detents: .medium = 0.5, .large = 1, .fraction(x) = x. */
const sheet = (detents: number[]) =>
  ({ presentation: 'formSheet', sheetAllowedDetents: detents, sheetGrabberVisible: true }) as const;
const cover = { presentation: 'fullScreenModal' } as const;

export default function RootLayout() {
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    boot()
      .catch((e: unknown) => console.error('Boot failed', e))
      .finally(() => {
        setBooted(true);
        SplashScreen.hideAsync().catch(() => {});
      });
  }, []);

  const { theme: forcedTheme } = useDemoState();
  useEffect(() => {
    // Native chrome (tab bar, sheets, alerts) follows the forced appearance too.
    if (forcedTheme && Platform.OS !== 'web') setAppAppearance(forcedTheme);
  }, [forcedTheme]);

  return (
    <ThemeProvider scheme={forcedTheme ?? undefined}>
      <WebFrame>
        <NavThemeFromTokens>
          <View style={{ flex: 1 }}>
            <RootStack booted={booted} />
            <ToastHost />
          </View>
        </NavThemeFromTokens>
      </WebFrame>
    </ThemeProvider>
  );
}

function RootStack({ booted }: { booted: boolean }) {
  const gate = useGate();
  const ready = booted && gate.ready;
  const blocked = gate.ageBlocked;

  // -demoScreen <n> (launch argument): route through the demo screen once the gate is ready.
  useEffect(() => {
    const n = getDemoArgs().demoScreen;
    if (ready && DEMO_ENABLED && n !== null) router.replace(`/demo/screen/${n}`);
  }, [ready]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={ready && blocked}>
        <Stack.Screen name="age-stop" options={{ gestureEnabled: false }} />
      </Stack.Protected>
      <Stack.Protected guard={ready && !blocked && !gate.onboarded}>
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      </Stack.Protected>
      <Stack.Protected guard={ready && !blocked && gate.onboarded}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={ready && !blocked}>
        <Stack.Screen name="camera" options={cover} />
        <Stack.Screen name="shoe-snap" options={cover} />
        <Stack.Screen name="scan" options={cover} />
        <Stack.Screen name="photo/[checkId]" options={cover} />
        <Stack.Screen name="share/[checkId]" options={cover} />
        <Stack.Screen name="paywall" options={cover} />
        <Stack.Screen name="sheets/why/[checkId]" options={sheet([0.78, 1])} />
        {/* The mockup's height (its top at y = 150 of 874); at full height ~200 pt sat empty under "Save correction" (DECISIONS-LOG #56). */}
        <Stack.Screen name="sheets/correct/[checkId]" options={sheet([0.83, 1])} />
        <Stack.Screen name="sheets/added/[checkId]" options={sheet([0.5, 1])} />
        {/* 0.62: at 0.5 the second row of pairs was cut mid-label. */}
        <Stack.Screen name="sheets/pick-shoes/[checkId]" options={sheet([0.62, 1])} />
        <Stack.Screen name="sheets/tell-me/[checkId]" options={sheet([0.5])} />
        <Stack.Screen name="sheets/edit-item/[id]" options={sheet([1])} />
        <Stack.Screen name="sheets/rotation" options={sheet([0.5])} />
        <Stack.Screen name="sheets/next-buy" options={sheet([0.5])} />
        <Stack.Screen name="sheets/describe" options={sheet([0.5, 1])} />
        <Stack.Screen name="sheets/fact/[id]" options={sheet([0.5])} />
        <Stack.Screen name="sheets/looks-by-name" options={sheet([0.5])} />
        {/* 02 O3w asked for a 320 pt wheel; it's a list of years now (no new package), so it opens taller. */}
        <Stack.Screen name="sheets/birth-year" options={sheet([0.6, 1])} />
        <Stack.Screen name="sheets/consent" options={sheet([1])} />
        <Stack.Screen name="sheets/swap/[ideaId]" options={sheet([0.5])} />
        <Stack.Screen name="sheets/sample-photos" options={sheet([0.6, 1])} />
      </Stack.Protected>
      <Stack.Protected guard={DEMO_ENABLED}>
        <Stack.Screen name="demo/screen/[n]" />
        <Stack.Screen name="demo/index" />
        <Stack.Screen name="demo/lockscreen" options={cover} />
      </Stack.Protected>
    </Stack>
  );
}

/** React Navigation's theme from our tokens, so native headers and backgrounds match. */
function NavThemeFromTokens({ children }: { children: ReactNode }) {
  const { scheme, colors } = useTheme();
  const value = useMemo<NavigationTheme>(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      dark: scheme === 'dark',
      colors: {
        ...base.colors,
        primary: colors.accent,
        background: colors.bg,
        card: colors.bg,
        text: colors.ink,
        border: colors.line,
        notification: colors.accent,
      },
    };
  }, [scheme, colors]);
  return (
    <NavThemeProvider value={value}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {children}
    </NavThemeProvider>
  );
}

/** iPhone 17 Pro, 402 × 874 pt: safe areas 62 top / 34 bottom (05 §5.2 `frame=1`, web only). */
const FRAME_INSETS = { top: 62, bottom: 34, left: 0, right: 0 };
const FRAME_RECT = { x: 0, y: 0, width: 402, height: 874 };

function WebFrame({ children }: { children: ReactNode }) {
  const { frame } = useDemoState();
  if (Platform.OS !== 'web' || !frame) return <>{children}</>;
  return (
    // A fixed 402 × 874 box: headless Chrome can't make a window narrower than ~500 px.
    <View style={{ width: FRAME_RECT.width, height: FRAME_RECT.height, overflow: 'hidden' }}>
      <SafeAreaFrameContext.Provider value={FRAME_RECT}>
        <SafeAreaInsetsContext.Provider value={FRAME_INSETS}>{children}</SafeAreaInsetsContext.Provider>
      </SafeAreaFrameContext.Provider>
    </View>
  );
}

// Root: providers, the gate (02 §1.1, 06 §8) and every modal and sheet route, so only one
// modal shows at a time. Order of guards: age stop → onboarding → tabs.
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform, View } from 'react-native';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavThemeProvider, router, type ErrorBoundaryProps, type Theme as NavigationTheme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaFrameContext, SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { ThemeProvider, setAppAppearance, useKittedFonts, useTheme } from '@/design-system';
import { DEMO_ENABLED } from '@/demo/config';
import { SHARE_CARD_BUILT } from '@/config/features';
import { usePaywallOn } from '@/features/paywall/switch';
import { ToastHost } from '@/features/toast/ToastHost';
import { useDemoState } from '@/demo/demoState';
import { useGate } from '@/state/appGate';
import { boot } from '@/state/boot';
import { startConnectivity } from '@/services/connectivity';
import { getDemoArgs } from '@/state/session';
import { CrashScreen } from '@/features/crash/CrashScreen';
import { demoCrashCheck } from '@/demo/demoCrash';
import { installErrorHandler } from '@/services/errors/log';

SplashScreen.preventAutoHideAsync().catch(() => {});
// Every uncaught JS error leaves a line in Documents/logs/errors.log, in every build (09 §23 E3, #353).
installErrorHandler();

/** A screen that throws while it draws shows the crash screen, not a blank app (09 §23 E1, #353). */
export function ErrorBoundary(props: ErrorBoundaryProps) {
  SplashScreen.hideAsync().catch(() => {});
  return <CrashScreen {...props} />;
}

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
        // The offline banner's signal (09 §20.8 G18.1): a check now and on each return to the foreground.
        startConnectivity();
      });
  }, []);

  // Native builds embed Archivo (expo-font plugin); the web preview loads it here. The re-render
  // when it lands lets ThemeProvider pick it up.
  useKittedFonts();

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
            {/* After boot: the demo arguments are read then (and the compiler would keep a first-render read). */}
            {DEMO_ENABLED && booted ? <DemoCrash /> : null}
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
  // The paywall sells nothing while it's off (a mock store): no link may open it (09 §20.7 R2, #323).
  const paywall = usePaywallOn();
  // Swap one at the accessibility sizes: its title fills the medium detent and a pick's options would open out of sight
  // (09-ui-review §28, #370), so it opens full height.
  const { isAccessibilitySize } = useTheme();

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
        <Stack.Screen name="scan" options={cover} />
        <Stack.Screen name="photo/[checkId]" options={cover} />
        <Stack.Screen name="sheets/why/[checkId]" options={sheet([0.78, 1])} />
        {/* The mockup's height (its top at y = 150 of 874); at full height ~200 pt sat empty under "Save correction" (DECISIONS-LOG #56). */}
        <Stack.Screen name="sheets/correct/[checkId]" options={sheet([0.83, 1])} />
        <Stack.Screen name="sheets/added/[checkId]" options={sheet([0.5, 1])} />
        {/* 0.62: at 0.5 the second row of pairs was cut mid-label. */}
        <Stack.Screen name="sheets/pick-shoes/[checkId]" options={sheet([0.62, 1])} />
        <Stack.Screen name="sheets/tell-me/[checkId]" options={sheet([0.5])} />
        <Stack.Screen name="sheets/edit-item/[id]" options={sheet([0.75, 1])} />
        <Stack.Screen name="sheets/next-buy" options={sheet([0.5])} />
        <Stack.Screen name="sheets/swap/[ideaId]" options={sheet(isAccessibilitySize ? [1] : [0.5, 1])} />
        <Stack.Screen name="sheets/fact/[id]" options={sheet([0.5])} />
        {/* 02 O3w asked for a 320 pt wheel; it's a list of years now (no new package), so it opens taller. */}
        <Stack.Screen name="sheets/birth-year" options={sheet([0.6, 1])} />
        <Stack.Screen name="sheets/consent" options={sheet([1])} />
        {/* S26's "See an example" (09-ui-review §20.8 G23): O1e as a sheet once onboarding is done. */}
        <Stack.Screen name="sheets/example" options={sheet([1])} />
        <Stack.Screen name="sheets/sample-photos" options={sheet([0.6, 1])} />
        <Stack.Screen name="sheets/scan-inbox" options={sheet([0.6, 1])} />
        <Stack.Screen name="sheets/merge/[id]" options={sheet([0.6, 1])} />
        {/* A1 (10-onboarding.md): 0.7 leaves room for the email field and its button above the keyboard. */}
        <Stack.Screen name="sheets/sign-in" options={sheet([0.7, 1])} />
      </Stack.Protected>
      <Stack.Protected guard={ready && !blocked && paywall}>
        <Stack.Screen name="paywall" options={cover} />
      </Stack.Protected>
      {/* The share card is a placeholder until P6: reachable only behind its switch, or on demo screen 20 (R12). */}
      <Stack.Protected guard={ready && !blocked && (SHARE_CARD_BUILT || DEMO_ENABLED)}>
        <Stack.Screen name="share/[checkId]" options={cover} />
      </Stack.Protected>
      <Stack.Protected guard={DEMO_ENABLED}>
        <Stack.Screen name="demo/screen/[n]" />
        <Stack.Screen name="demo/index" />
        <Stack.Screen name="demo/lockscreen" options={cover} />
      </Stack.Protected>
    </Stack>
  );
}

/** -demoCrash 1 (demo builds only, 09 §23 E5): throws while drawing until Try again, so the crash screen can be seen. */
function DemoCrash() {
  demoCrashCheck();
  return null;
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
        // Native header buttons are ink; copper is for score movement only (#231).
        primary: colors.ink,
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

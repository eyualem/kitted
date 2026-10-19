// The crash screen (09-ui-review §23 E1, #353): what a screen that throws while it draws shows instead of a blank app.
// expo-router's own ErrorBoundary, exported by the root layout, hands it the error and a retry. It replaces the root
// layout's providers, so it brings its own theme. The error goes to the phone's log (services/errors/log.ts) once.
import { useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import { router, type ErrorBoundaryProps } from 'expo-router';
import { EmptyState, KButton, space, ThemeProvider, useTheme } from '@/design-system';
import { disarmDemoCrash } from '@/demo/demoCrash';
import { useDemoState } from '@/demo/demoState';
import { t } from '@/i18n/en';
import { recordError } from '@/services/errors/log';

export function CrashScreen({ error, retry }: ErrorBoundaryProps) {
  const { theme } = useDemoState();
  useEffect(() => {
    recordError(error, 'render');
  }, [error]);
  return (
    <ThemeProvider scheme={theme ?? undefined}>
      <Body retry={retry} />
    </ThemeProvider>
  );
}

function Body({ retry: redraw }: Pick<ErrorBoundaryProps, 'retry'>) {
  const { colors } = useTheme();
  const retry = () => {
    disarmDemoCrash();
    return redraw();
  };
  const home = () => {
    // Back through the gate to the start, then draw again.
    try {
      router.replace('/');
    } catch {
      // no navigator yet (the root itself threw): retry alone redraws it
    }
    void retry();
  };
  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: space.gutter }}>
      <EmptyState title={t('crash.title')} body={t('crash.body')}>
        <View style={{ gap: space.rowGap, alignSelf: 'stretch' }}>
          <KButton title={t('crash.retry')} size="regular" fullWidth onPress={() => void retry()} />
          <KButton title={t('gone.home')} size="regular" kind="secondary" fullWidth onPress={home} />
        </View>
      </EmptyState>
    </ScrollView>
  );
}

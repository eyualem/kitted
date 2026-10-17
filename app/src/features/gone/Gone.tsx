// A record that's gone (09 §20.7 R11, #322): a look, piece, photo, day or check deleted meanwhile, or an old link. The
// page or sheet says so instead of showing nothing.
import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { EmptyState, space, useTheme } from '@/design-system';
import { SheetScaffold } from '@/features/sheet/SheetScaffold';
import { t } from '@/i18n/en';

/** A pushed page or full-screen cover. `children`: an action under the words (the not-found page's "Go to Kitted"). */
export function GonePage({ children }: { children?: ReactNode }) {
  const { colors } = useTheme();
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: colors.bg }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: space.gutter }}>
      <EmptyState title={t('gone.title')} body={t('gone.body')}>
        {children}
      </EmptyState>
    </ScrollView>
  );
}

/** A sheet: its title says it, with the usual close. */
export function GoneSheet() {
  return <SheetScaffold title={t('gone.title')} subtitle={t('gone.body')} />;
}

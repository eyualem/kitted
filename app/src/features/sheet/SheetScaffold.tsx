// The one supported shape for a scrolling iOS formSheet on react-native-screens 4.26:
// the ScrollView IS the route's root (no wrapping View), with the title row + X as its sticky
// first child. react-native-screens resizes the first ScrollView it finds in a sheet on every
// layout; any wrapper View makes it fall back to `setFrame:self.frame`, which moved the content
// out of view (DECISIONS-LOG #14). Top spacing goes in the header's padding, never as margins.
// No KeyboardAvoidingView: `automaticallyAdjustKeyboardInsets` handles the inline editors.
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton, KText, TextLink, space, useTheme } from '@/design-system';
import { t } from '@/i18n/en';

export interface SheetScaffoldProps {
  title: string;
  /** Optional line under the title (sheetSubtitle role). */
  subtitle?: string;
  children?: ReactNode;
  onClose?: () => void;
  /** A text button (e.g. "Done") in place of the X. */
  doneLabel?: string;
}

export function SheetScaffold({ title, subtitle, children, onClose, doneLabel }: SheetScaffoldProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      stickyHeaderIndices={[0]}
      contentContainerStyle={{ paddingBottom: insets.bottom + space.xl }}
      contentInsetAdjustmentBehavior="never"
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
    >
      {/* Sticky headers: RN moves this child's style onto its own wrapper and gives the child
          `flex: 1`, so the row layout lives one level down. */}
      <View>
        <View style={[styles.header, { backgroundColor: colors.bg }]}>
          <View style={styles.titles}>
            <KText role="sheetTitle" accessibilityRole="header">
              {title}
            </KText>
            {subtitle ? <KText role="sheetSubtitle">{subtitle}</KText> : null}
          </View>
          {doneLabel ? (
            <TextLink title={doneLabel} onPress={onClose ?? (() => router.back())} compact />
          ) : (
            <IconButton icon="close" label={t('common.close')} onPress={onClose ?? (() => router.back())} />
          )}
        </View>
      </View>
      <View style={styles.body}>{children}</View>
    </ScrollView>
  );
}

/** The bordered, rounded list sheets put their rows in (S8, S11). */
export function SheetList({ children }: { children?: ReactNode }) {
  const { colors } = useTheme();
  return <View style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 20, borderCurve: 'continuous', overflow: 'hidden' }}>{children}</View>;
}

const styles = StyleSheet.create({
  header: {
    paddingTop: space.xxl,
    paddingHorizontal: space.xl,
    paddingBottom: space.m,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.m,
  },
  titles: { flex: 1, gap: space.xs },
  body: { paddingHorizontal: space.xl, gap: space.s },
});

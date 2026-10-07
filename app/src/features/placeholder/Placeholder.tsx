// P0 stand-in for a screen that a later phase builds. Shows the 02 screen ID, its name and
// the phase, plus an X for modals and sheets (02 §1.2: an escape from the first frame).
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton, KText, space, useTheme } from '@/design-system';
import { t } from '@/i18n/en';
import { SheetScaffold } from '@/features/sheet/SheetScaffold';

export type PlaceholderKind = 'tab' | 'push' | 'sheet' | 'cover';

export interface PlaceholderProps {
  id: string;
  name: string;
  phase: string;
  kind: PlaceholderKind;
  /** Extra line, e.g. the demo state the screen will show. */
  note?: string;
}

export function Placeholder({ id, name, phase, kind, note }: PlaceholderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const modal = kind === 'sheet' || kind === 'cover';
  const top = kind === 'cover' ? insets.top + space.s : kind === 'sheet' ? space.l : 0;

  if (kind === 'sheet') {
    return (
      <SheetScaffold title={t('demo.placeholder.title', { id, name })} subtitle={t('demo.placeholder.body', { phase })} />
    );
  }

  const content = (
    <>
      {modal ? (
        <View style={styles.closeRow}>
          <IconButton icon="close" label={t('common.close')} onPress={() => router.back()} />
        </View>
      ) : null}
      <KText variant="title2" weight="700">
        {t('demo.placeholder.title', { id, name })}
      </KText>
      <KText variant="subheadline" color="ink2">
        {t('demo.placeholder.body', { phase })}
      </KText>
      {note ? (
        <KText variant="footnote" color="ink3" mono="label">
          {note}
        </KText>
      ) : null}
    </>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: top }]}>
      {/* Covers use a plain View; sheets use SheetScaffold (a ScrollView inside a wrapper View
          is moved out of view by react-native-screens, DECISIONS-LOG #14). */}
      {modal ? (
        <View style={styles.body}>{content}</View>
      ) : (
        <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.body}>
          {content}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  closeRow: { flexDirection: 'row', marginLeft: -space.xs, marginBottom: space.s },
  body: { padding: space.xl, gap: space.s },
});

// P0 stand-in for a screen that a later phase builds. Shows the 02 screen ID, its name and
// the phase, plus an X for modals and sheets (02 §1.2: an escape from the first frame).
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton, KText, space, useTheme } from '@/design-system';
import { t } from '@/i18n/en';

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

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: top }]}>
      {modal ? (
        <View style={styles.closeRow}>
          <IconButton icon="close" label={t('common.close')} onPress={() => router.back()} />
        </View>
      ) : null}
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.body}>
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  closeRow: { paddingHorizontal: space.l, flexDirection: 'row' },
  body: { padding: space.xl, gap: space.s },
});

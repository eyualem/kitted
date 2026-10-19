// G3 · Latest (02 §G3, 07 §6.1; 09-ui-review §23 L2, #353): a 44 pt capsule centred above the composer while he's
// scrolled up; a tap takes the thread to its newest row.
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, KText, opacity, useTheme } from '@/design-system';
import { t } from '@/i18n/en';

/** Its label stops growing here (an overlay over the thread, like the offline banner). */
const PILL_MAX_SCALE = 1.5;

export function LatestPill({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={t('common.latest')}
        hitSlop={8}
        style={({ pressed }) => [styles.capsule, { backgroundColor: colors.primary, opacity: pressed ? opacity.pressed : 1 }]}
      >
        <Icon name="arrow.down" size={15} color={colors.onPrimary} weight="semibold" scalesWithText />
        <KText variant="subheadline" weight="600" style={{ color: colors.onPrimary }} maxFontSizeMultiplier={PILL_MAX_SCALE}>
          {t('common.latest')}
        </KText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
  capsule: {
    minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, borderRadius: 999,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
});

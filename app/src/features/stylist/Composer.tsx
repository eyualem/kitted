// The Stylist composer (design-spec A7/A8): compact (camera · library · field) during an
// exchange; idle (quick-starts + "Check my fit" pill · library · "Ask…") otherwise.
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Icon, KText, QuickStartChip, opacity, useTheme } from '@/design-system';
import { t } from '@/i18n/en';

export interface ComposerProps {
  mode: 'compact' | 'idle';
  onCamera: () => void;
  onLibrary: () => void;
  onSend?: (text: string) => void;
}

export function Composer({ mode, onCamera, onLibrary, onSend }: ComposerProps) {
  const { colors } = useTheme();
  const [text, setText] = useState('');
  const idle = mode === 'idle' && text.length === 0;
  return (
    <View style={styles.wrap}>
      {idle ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickRow} contentContainerStyle={styles.quickContent}>
          <QuickStartChip title={t('quick.wear')} icon="tee" />
          <QuickStartChip title={t('quick.bought')} icon="bag" />
          <QuickStartChip title={t('quick.ask')} icon="question" />
        </ScrollView>
      ) : null}
      <View style={styles.row}>
        {idle ? (
          <Pressable
            onPress={onCamera}
            accessibilityRole="button"
            accessibilityLabel={t('composer.a11y.camera')}
            style={({ pressed }) => [styles.fitBtn, { backgroundColor: colors.primary, opacity: pressed ? opacity.pressed : 1 }]}
          >
            <Icon name="camera" size="large" color={colors.onPrimary} />
            <KText variant="subheadline" weight="600" color={colors.onPrimary}>
              {t('composer.check')}
            </KText>
          </Pressable>
        ) : (
          <Pressable
            onPress={onCamera}
            accessibilityRole="button"
            accessibilityLabel={t('composer.a11y.camera')}
            hitSlop={2}
            style={({ pressed }) => [styles.circle, { backgroundColor: colors.primary, opacity: pressed ? opacity.pressed : 1 }]}
          >
            <Icon name="camera" size="large" color={colors.onPrimary} />
          </Pressable>
        )}
        <Pressable
          onPress={onLibrary}
          accessibilityRole="button"
          accessibilityLabel={t('cam.a11y.library')}
          hitSlop={2}
          style={({ pressed }) => [styles.circle, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, opacity: pressed ? opacity.pressed : 1 }]}
        >
          <Icon name="photo" size="regular" color="ink2" />
        </Pressable>
        <View style={[styles.field, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={idle ? t('composer.placeholderIdle') : t('composer.placeholder')}
            placeholderTextColor={colors.ink3}
            accessibilityLabel={t('composer.a11y.field')}
            multiline
            numberOfLines={1}
            style={[styles.input, { color: colors.ink }]}
          />
          {text.length > 0 ? (
            <Pressable
              onPress={() => {
                onSend?.(text);
                setText('');
              }}
              accessibilityRole="button"
              accessibilityLabel={t('composer.a11y.send')}
              style={styles.send}
            >
              <Icon name="send" size={28} color={colors.primary} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 8, gap: 10 },
  quickRow: { marginRight: -16 },
  quickContent: { gap: 8, paddingRight: 16, paddingVertical: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  circle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  fitBtn: { height: 40, borderRadius: 20, paddingLeft: 13, paddingRight: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
  field: { flex: 1, minHeight: 40, borderRadius: 20, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 4 },
  input: { flex: 1, fontSize: 17, lineHeight: 22, paddingTop: 8, paddingBottom: 8, maxHeight: 120 },
  send: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
});

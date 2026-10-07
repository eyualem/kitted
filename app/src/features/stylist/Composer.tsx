// The Stylist composer (design-spec A7/A8): compact (camera · field) during an exchange; idle
// (quick-starts + "Check my fit" pill · "Ask…") otherwise. Differs from the mockup: no
// photo-library circle (the camera screen has the library thumbnail, the iOS norm), and the
// camera button hides while he types so the field gets the full width (DECISIONS-LOG #28).
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { CONTROL_TEXT_MAX_SCALE, Icon, KText, QuickStartChip, opacity, useTheme } from '@/design-system';
import { t } from '@/i18n/en';

export interface ComposerProps {
  mode: 'compact' | 'idle';
  onCamera: () => void;
  onSend?: (text: string) => void;
}

export function Composer({ mode, onCamera, onSend }: ComposerProps) {
  const { colors, isAccessibilitySize } = useTheme();
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  // Typing (field focused, or text in it) shows the compact field alone (02 S1: compact while
  // the keyboard is up; the quick-start row hides while typing).
  const typing = focused || text.length > 0;
  const idle = mode === 'idle' && !typing;
  return (
    <View style={styles.wrap}>
      {idle ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickRow} contentContainerStyle={styles.quickContent}>
          <QuickStartChip title={t('quick.wear')} icon="tee" />
          <QuickStartChip title={t('quick.bought')} icon="bag" />
          <QuickStartChip title={t('quick.ask')} icon="question" />
        </ScrollView>
      ) : null}
      {/* AX sizes: the field gets its own full-width row under the buttons (design-spec A7). */}
      <View style={isAccessibilitySize ? styles.column : styles.row}>
        {typing ? null : idle ? (
          <Pressable
            onPress={onCamera}
            accessibilityRole="button"
            accessibilityLabel={t('composer.a11y.camera')}
            style={({ pressed }) => [styles.fitBtn, { backgroundColor: colors.primary, opacity: pressed ? opacity.pressed : 1 }]}
          >
            <Icon name="camera" size="large" color={colors.onPrimary} />
            <KText variant="subheadline" weight="600" color={colors.onPrimary} maxFontSizeMultiplier={CONTROL_TEXT_MAX_SCALE}>
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
        <View style={[styles.field, isAccessibilitySize ? { alignSelf: 'stretch' } : { flex: 1 }, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={idle ? t('composer.placeholderIdle') : t('composer.placeholder')}
            placeholderTextColor={colors.ink3}
            accessibilityLabel={t('composer.a11y.field')}
            multiline
            numberOfLines={1}
            maxFontSizeMultiplier={CONTROL_TEXT_MAX_SCALE}
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
  column: { gap: 8, alignItems: 'flex-start' },
  circle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  fitBtn: { minHeight: 40, borderRadius: 20, paddingLeft: 13, paddingRight: 16, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 8 },
  field: { minHeight: 40, borderRadius: 20, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 4 },
  input: { flex: 1, fontSize: 17, lineHeight: 22, paddingTop: 8, paddingBottom: 8, maxHeight: 120 },
  send: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
});

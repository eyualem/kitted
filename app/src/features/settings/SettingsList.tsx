// The grouped list You, Plan & usage and Notifications are built from (02 Y4–Y6; mockups/theme-round2.html
// `.rowi`): one mono label per section (#246), a KCard of rows with hairlines between them, 44 pt+ rows, titles
// 16 pt semibold, details 13 pt ink3. Links are ink (copper is only for a score that moves, #231). At accessibility
// sizes a row's title and value stack instead of squeezing.
import { Children, isValidElement, type ReactNode } from 'react';
import { Pressable, ScrollView, Switch, View, type StyleProp, type ViewStyle } from 'react-native';
import { Icon, KCard, KText, radius, MonoLabel, MorphPicker, RowDivider, opacity, space, useTheme, type MorphOption } from '@/design-system';
import { t } from '@/i18n/en';

export function SettingsScroll({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingHorizontal: space.gutter, paddingTop: space.m, paddingBottom: space.xxxl, gap: space.xxl }}
    >
      {children}
    </ScrollView>
  );
}

/** A section: an optional mono label, the card of rows, an optional footnote under it. Falsy rows are skipped. */
export function Section({ label, footer, header, children }: { label?: string; footer?: string; header?: string; children: ReactNode }) {
  const rows = Children.toArray(children).filter(isValidElement);
  if (rows.length === 0 && !header) return null;
  return (
    <View style={{ gap: space.s - 2 }}>
      {label ? (
        <View style={{ paddingHorizontal: space.xs }} accessibilityRole="header">
          <MonoLabel>{label}</MonoLabel>
        </View>
      ) : null}
      {header ? (
        <KText variant="subheadline" color="ink2" style={{ paddingHorizontal: space.xs, paddingBottom: space.xs }}>
          {header}
        </KText>
      ) : null}
      {rows.length > 0 ? (
        <KCard radius={radius.cardSmall}>
          {rows.map((r, i) => (
            <View key={r.key ?? i}>
              {i > 0 ? <RowDivider inset={space.rowX} /> : null}
              {r}
            </View>
          ))}
        </KCard>
      ) : null}
      {footer ? (
        <KText variant="footnote" color="ink3" style={{ paddingHorizontal: space.xs, paddingTop: 1 }}>
          {footer}
        </KText>
      ) : null}
    </View>
  );
}

/** How far a one-word row title may shrink to stay whole on its line (it only shrinks when it doesn't fit). */
const TITLE_MIN_SCALE = 0.5;

function useRowStyle(): StyleProp<ViewStyle> {
  const { isAccessibilitySize: ax } = useTheme();
  return ax
    ? { minHeight: 44, paddingVertical: space.rowY, paddingHorizontal: space.rowX, gap: space.xs }
    : { minHeight: 44, paddingVertical: space.rowY, paddingHorizontal: space.rowX, gap: space.m, flexDirection: 'row', alignItems: 'center' };
}

function Title({ children, color = 'ink', hidden, fit }: { children: string; color?: 'ink' | 'ink2'; hidden?: boolean; fit?: boolean }) {
  return (
    <KText
      variant="callout"
      weight="600"
      color={color}
      style={{ flexShrink: 1 }}
      accessibilityElementsHidden={hidden}
      importantForAccessibility={hidden ? 'no-hide-descendants' : undefined}
      {...(fit ? { numberOfLines: 1, adjustsFontSizeToFit: true, minimumFontScale: TITLE_MIN_SCALE } : null)}
    >
      {children}
    </KText>
  );
}

/** A tappable row: a push (chevron) or an action (none). `value` sits on the right in ink3 ("Free plan"); `detail` is
 *  one quiet line under the title ("Seen as slim and as wide. Which is it?"), read after the value. */
export function LinkRow({ title, value, onPress, hint, chevron = true, detail, testID }: { title: string; value?: string; onPress: () => void; hint?: string; chevron?: boolean; detail?: string; testID?: string }) {
  const { colors, isAccessibilitySize: ax } = useTheme();
  const row = useRowStyle();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${value ? t('settings.a11y.value', { label: title, value }) : title}${detail ? `. ${detail}` : ''}`}
      accessibilityHint={hint}
      style={({ pressed }) => [row, pressed && { backgroundColor: colors.surface2 }]}
    >
      <View style={ax ? { gap: 2 } : { flex: 1, gap: 2 }}>
        {/* One word ("Acknowledgements") can't wrap between words: at the largest sizes it shrinks to its line
            instead of breaking mid-word (SY1.6). Titles with spaces wrap as usual. */}
        <Title fit={!/\s/.test(title.trim())}>{title}</Title>
        {detail && !ax ? <Detail>{detail}</Detail> : null}
      </View>
      {value || chevron ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s, alignSelf: ax ? 'flex-start' : 'auto' }}>
          {value ? (
            <KText variant="subheadline" color="ink3">
              {value}
            </KText>
          ) : null}
          {chevron && !ax ? <Icon name="next" size={13} weight="semibold" color="ink3" /> : null}
        </View>
      ) : null}
      {/* stacked at the largest sizes: label, value, then the line */}
      {detail && ax ? <Detail>{detail}</Detail> : null}
    </Pressable>
  );
}

function Detail({ children }: { children: string }) {
  return (
    <KText variant="footnote" color="ink3">
      {children}
    </KText>
  );
}

/** A row whose value is a choice: the inline pill grows into its menu (MorphPicker). VoiceOver: "Appearance, System". */
export function PickerRow<T extends string>({ title, value, options, onPick, spoken, testID, disabled = false }: {
  title: string; value: T; options: readonly MorphOption<T>[]; onPick: (v: T) => void; testID?: string;
  /** VoiceOver, when the title alone is too short out of context. */
  spoken?: (valueLabel: string) => string;
  /** Greyed (You → Notifications with iOS off): the row's contents at 0.4, not tappable, VoiceOver "dimmed". */
  disabled?: boolean;
}) {
  const row = useRowStyle();
  const { isAccessibilitySize: ax } = useTheme();
  const label = options.find((o) => o.value === value)?.label ?? value;
  return (
    <View testID={testID} style={row}>
      <View style={[ax ? undefined : { flex: 1 }, disabled && { opacity: opacity.disabled }]}>
        <Title hidden>{title}</Title>
      </View>
      <View style={{ minHeight: 24, justifyContent: 'center', alignSelf: ax ? 'flex-start' : 'auto', opacity: disabled ? opacity.disabled : 1 }}>
        <MorphPicker
          inline
          label={label}
          value={value}
          sections={[{ options }]}
          onPick={(v) => {
            if (!disabled) onPick(v);
          }}
          disabled={disabled}
          accessibilityLabel={spoken ? spoken(label) : t('settings.a11y.value', { label: title, value: label })}
        />
      </View>
    </View>
  );
}

/** A switch row (02 Y6). The switch carries the title for VoiceOver and announces on / off itself; `hint` says what
 *  flipping it does. */
export function ToggleRow({ title, detail, value, onChange, disabled, hint, testID }: { title: string; detail?: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean; hint?: string; testID?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ minHeight: 44, paddingVertical: space.rowY, paddingHorizontal: space.rowX, gap: space.m, flexDirection: 'row', alignItems: 'center', opacity: disabled ? opacity.disabled : 1 }}>
      <View style={{ flex: 1, gap: 2 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Title>{title}</Title>
        {detail ? (
          <KText variant="footnote" color="ink3">
            {detail}
          </KText>
        ) : null}
      </View>
      <Switch
        testID={testID}
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ true: colors.good, false: undefined }}
        accessibilityLabel={detail ? t('settings.a11y.value', { label: title, value: detail }) : title}
        accessibilityHint={hint}
      />
    </View>
  );
}

/** A read-only row: label left, value right (tabular), read as one element ("Fit checks, 0 of 1 used"). */
export function ValueRow({ label, value, spoken }: { label: string; value: string; spoken: string }) {
  const row = useRowStyle();
  const { isAccessibilitySize: ax } = useTheme();
  return (
    <View style={row} accessible accessibilityLabel={spoken}>
      <View style={ax ? undefined : { flex: 1 }}>
        <Title>{label}</Title>
      </View>
      <KText variant="callout" color="ink2" tabular>
        {value}
      </KText>
    </View>
  );
}

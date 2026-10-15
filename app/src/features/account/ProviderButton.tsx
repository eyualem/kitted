// A1's three buttons (10-onboarding.md §4.1), all the same size (Apple 4.8 and Google's guidelines: none smaller than
// the others). Apple: black on light, white on dark, the Apple logo and "Continue with Apple" (HIG). Google: the
// four-color G, never recolored, on white with a #747775 border (light) or #131314 with #8E918F (dark). Email: the
// app's secondary button. The stand-in draws Apple's button with the SF Symbol; the Firebase build swaps in the system
// AppleAuthenticationButton (expo-apple-authentication), which App Review prefers.
import { ActivityIndicator, Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Icon, KText, opacity, useTheme } from '@/design-system';
import { CONTROL_TEXT_MAX_SCALE, size } from '@/design-system/tokens';
import { t } from '@/i18n/en';
import type { AuthProvider } from './auth';

/** Google's standard "G" (Sign-In branding guidelines), 48 × 48 artwork. */
export function GoogleG({ size: s = 18 }: { size?: number }) {
  return (
    // SVG can't take the iOS accessibility props (it warns on web): the View hides it.
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <Svg width={s} height={s} viewBox="0 0 48 48">
      <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </Svg>
    </View>
  );
}

const LABEL = { apple: 'acct.apple', google: 'acct.google', email: 'acct.email' } as const;

export function ProviderButton({ provider, onPress, busy, disabled }: { provider: AuthProvider; onPress: () => void; busy: boolean; disabled: boolean }) {
  const { colors, scheme, isAccessibilitySize } = useTheme();
  const dark = scheme === 'dark';
  const look =
    provider === 'apple'
      ? { bg: dark ? '#FFFFFF' : '#000000', fg: dark ? '#000000' : '#FFFFFF', border: 'transparent' }
      : provider === 'google'
        ? { bg: dark ? '#131314' : '#FFFFFF', fg: dark ? '#E3E3E3' : '#1F1F1F', border: dark ? '#8E918F' : '#747775' }
        : { bg: colors.surface2, fg: colors.ink, border: 'transparent' };
  const title = busy ? t('acct.signingIn') : t(LABEL[provider]);
  const logo = busy ? (
    <ActivityIndicator color={look.fg} />
  ) : provider === 'apple' ? (
    <Icon name="apple.logo" size={19} color={look.fg} weight="medium" />
  ) : provider === 'google' ? (
    <GoogleG size={18} />
  ) : (
    <Icon name="envelope" size={18} color={look.fg} weight="medium" />
  );
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={busy ? undefined : t('acct.a11y.signInHint', { provider: t(`acct.provider.${provider}`) })}
      accessibilityState={{ disabled, busy }}
      style={({ pressed }) => ({ opacity: disabled && !busy ? opacity.disabled : pressed ? opacity.pressed : 1 })}
    >
      <View
        style={{
          minHeight: size.buttonLarge,
          borderRadius: size.buttonLarge / 2,
          borderCurve: 'continuous',
          backgroundColor: look.bg,
          borderWidth: provider === 'google' ? 1 : 0,
          borderColor: look.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          paddingHorizontal: 20,
          paddingVertical: 6,
        }}
      >
        {/* The logo keeps its own width so the label stays centered whether it shows a spinner or the logo. */}
        <View style={{ width: 20, alignItems: 'center' }}>{logo}</View>
        <KText
          role="buttonLarge"
          color={look.fg}
          maxFontSizeMultiplier={CONTROL_TEXT_MAX_SCALE}
          numberOfLines={isAccessibilitySize ? 2 : 1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          style={{ flexShrink: 1, textAlign: 'center' }}
        >
          {title}
        </KText>
        <View style={{ width: 20 }} />
      </View>
    </Pressable>
  );
}

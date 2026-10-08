// EmptyState (03 "EmptyState"): ContentUnavailableView's layout rebuilt as a plain component
// (React Native can't host it): a centered 44 pt icon in ink3, a title3 semibold title, a
// subheadline ink2 body, then 1–2 buttons. Never a dead end: there's always one action.
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Icon, type IconProps } from './Icon';
import { KText } from './KText';

export interface EmptyStateProps {
  icon?: IconProps['name'];
  /** Replaces the icon (e.g. Lookbook's dashed ghost look). */
  art?: ReactNode;
  title?: string;
  body: string;
  /** The buttons, stacked. */
  children?: ReactNode;
}

export function EmptyState({ icon, art, title, body, children }: EmptyStateProps) {
  return (
    <View style={{ alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 32 }}>
      {art ?? (icon ? <Icon name={icon} size={44} color="ink3" /> : null)}
      {title ? (
        <KText variant="title3" weight="600" style={{ textAlign: 'center', marginTop: 8 }} accessibilityRole="header">
          {title}
        </KText>
      ) : null}
      <KText variant="subheadline" color="ink2" style={{ textAlign: 'center' }}>
        {body}
      </KText>
      {children ? <View style={{ alignSelf: 'stretch', alignItems: 'center', gap: 8, marginTop: 12 }}>{children}</View> : null}
    </View>
  );
}

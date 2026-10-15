// One of his photos on the piece page (#276): his real photo with the piece outlined and the rest dimmed
// (SightingCrop: below his head, true-view for a mirror selfie), square, "Cover" on the one shown first. A tap opens
// the photo; the photo's menu (Use as cover, Open the look, Not this piece, Remove photo) is a long-press (the
// native menu, PhotoMenu) and VoiceOver custom actions.
import { Pressable, View } from 'react-native';
import type { ComponentProps } from 'react';
import type { Button } from '@expo/ui/swift-ui';
import { KText, fixed, opacity } from '@/design-system';
import { t } from '@/i18n/en';
import type { PiecePhoto } from './piecePhotos';
import { SightingCrop } from './SightingCrop';

export interface PhotoAction {
  name: string;
  label: string;
  /** The native menu's SF Symbol. */
  systemImage: NonNullable<ComponentProps<typeof Button>['systemImage']>;
  destructive?: boolean;
  onAction: () => void;
}

export interface PiecePhotoTileProps {
  photo: PiecePhoto;
  size: number;
  /** VoiceOver: what the photo is ("Your photo from October 22, the piece outlined"). */
  label: string;
  actions: readonly PhotoAction[];
  onPress: () => void;
  onLongPress?: () => void;
}

export function PiecePhotoTile({ photo, size, label, actions, onPress, onLongPress }: PiecePhotoTileProps) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={photo.cover ? t('closet.piece.a11y.coverPhoto', { photo: label }) : label}
      accessibilityHint={t('closet.piece.a11y.photoHint')}
      accessibilityActions={actions.map((a) => ({ name: a.name, label: a.label }))}
      onAccessibilityAction={(e) => actions.find((a) => a.name === e.nativeEvent.actionName)?.onAction()}
      style={({ pressed }) => ({ opacity: pressed ? opacity.pressed : 1 })}
    >
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <SightingCrop source={photo.source} aspect={photo.aspect} box={photo.box} top={photo.top} mirrored={photo.mirrored} width={size} height={size} radius={14} />
        {photo.cover ? (
          <View style={{ position: 'absolute', left: 6, bottom: 6, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9, backgroundColor: fixed.photoTag }}>
            <KText variant="caption" weight="600" color={fixed.onDark} maxFontSizeMultiplier={1.4}>
              {t('closet.piece.cover')}
            </KText>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

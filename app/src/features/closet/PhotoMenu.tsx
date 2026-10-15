// A photo on the piece page outside iOS (the web preview, Android later): a long-press opens the same actions in a
// system alert. The native long-press menu is PhotoMenu.ios.tsx.
import { Alert } from 'react-native';
import { t } from '@/i18n/en';
import { PiecePhotoTile, type PiecePhotoTileProps } from './PiecePhotoTile';

export function PhotoMenu(props: PiecePhotoTileProps) {
  const open = () =>
    Alert.alert(props.label, undefined, [
      ...props.actions.map((a) => ({ text: a.label, style: a.destructive ? ('destructive' as const) : ('default' as const), onPress: a.onAction })),
      { text: t('common.cancel'), style: 'cancel' as const },
    ]);
  return <PiecePhotoTile {...props} onLongPress={open} />;
}

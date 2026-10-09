// His photo as evidence on a closet question (#117, #141): only the piece's own region, the piece outlined in the
// accent and the rest of the frame dimmed. Never shows anything above the piece's box (a top's box starts at the
// neck), so a face never appears. Pure layout: the image is scaled to cover the frame with the region centered.
import { Image } from 'expo-image';
import { View } from 'react-native';
import { useTheme } from '@/design-system';
import { cropLayout } from './cropLayout';

export interface SightingCropProps {
  source: number | string;
  /** The photo's width / height (kept photos are 3:4). */
  aspect?: number;
  /** The closet call's box: [ymin, xmin, ymax, xmax], 0–1000. */
  box: readonly number[];
  width: number;
  height: number;
  radius?: number;
}

export function SightingCrop({ source, aspect = 0.75, box, width, height, radius = 12 }: SightingCropProps) {
  const { colors } = useTheme();
  const { imgW, imgH, left, top, piece } = cropLayout(box, aspect, width, height);
  const dim = 'rgba(8,10,16,0.45)'; // the same in light and dark: it sits on a photo, not on the page
  return (
    <View style={{ width, height, borderRadius: radius, borderCurve: 'continuous', overflow: 'hidden', backgroundColor: colors.surface2 }}>
      <Image source={source} style={{ position: 'absolute', left, top, width: imgW, height: imgH }} contentFit="fill" />
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: piece.top, backgroundColor: dim }} />
      <View style={{ position: 'absolute', left: 0, right: 0, top: piece.bottom, bottom: 0, backgroundColor: dim }} />
      <View style={{ position: 'absolute', left: 0, width: piece.left, top: piece.top, height: piece.bottom - piece.top, backgroundColor: dim }} />
      <View style={{ position: 'absolute', left: piece.right, right: 0, top: piece.top, height: piece.bottom - piece.top, backgroundColor: dim }} />
      <View style={{
        position: 'absolute', left: piece.left, top: piece.top, width: piece.right - piece.left, height: piece.bottom - piece.top,
        borderWidth: 2, borderColor: colors.accent, borderRadius: 6,
      }} />
    </View>
  );
}

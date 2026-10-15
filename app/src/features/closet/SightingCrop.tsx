// His photo as evidence (#117, #141, #276): only the piece's own region, the piece outlined and the rest of the frame
// dimmed. Never shows anything above the piece's box (a top's box starts at the neck) nor above `top`, the line
// below his head (cropSafety.cropTop), so a face never appears. A mirror selfie (`mirrored`) is flipped back to true
// view, like its cut-out (#109), so a logo reads the right way. Pure layout: the image is scaled to cover the frame
// with the region centered; a region wider than the frame (a pair of shoes) is fitted to its width, with anything
// above the piece painted solid.
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
  /** The first photo row allowed (0–1000), below his head. */
  top?: number | null;
  /** A mirror selfie: shown flipped, true view. */
  mirrored?: boolean;
  width: number;
  height: number;
  radius?: number;
}

export function SightingCrop({ source, aspect = 0.75, box, top: minTop, mirrored, width, height, radius = 12 }: SightingCropProps) {
  const { colors } = useTheme();
  const { imgW, imgH, left, top, piece, hideAbove } = cropLayout(box, aspect, width, height, minTop);
  const dim = 'rgba(8,10,16,0.45)'; // the same in light and dark: it sits on a photo, not on the page
  return (
    <View style={{ width, height, borderRadius: radius, borderCurve: 'continuous', overflow: 'hidden', backgroundColor: colors.surface2 }}>
      {/* The whole frame flips for a mirror selfie: the region, its outline and the dimming stay together. */}
      <View style={{ width, height, transform: mirrored ? [{ scaleX: -1 }] : undefined }}>
        <Image source={source} style={{ position: 'absolute', left, top, width: imgW, height: imgH }} contentFit="fill" transition={0} />
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: piece.top, backgroundColor: dim }} />
        {hideAbove > 0 && <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: hideAbove, backgroundColor: colors.surface2 }} />}
        <View style={{ position: 'absolute', left: 0, right: 0, top: piece.bottom, bottom: 0, backgroundColor: dim }} />
        <View style={{ position: 'absolute', left: 0, width: piece.left, top: piece.top, height: piece.bottom - piece.top, backgroundColor: dim }} />
        <View style={{ position: 'absolute', left: piece.right, right: 0, top: piece.top, height: piece.bottom - piece.top, backgroundColor: dim }} />
        <View style={{
          position: 'absolute', left: piece.left, top: piece.top, width: piece.right - piece.left, height: piece.bottom - piece.top,
          borderWidth: 2, borderColor: colors.ink2, borderRadius: 6,
        }} />
      </View>
    </View>
  );
}

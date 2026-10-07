// DetectionTag (`.det`) — NOT USED IN V1 (ruling 13 removed the big photo; 02 D6 shows the
// found pieces as Pills in the skeleton card). Kept in case the founder brings it back.
// 28 pt capsule, 12 pt padding, footnote semibold white on fixed.photoTag (SOLID backing,
// never glass), 1 pt white @ 18% border. Pending: dim text + an ellipsis (not color-only).
// Upload notice: white @ 92% fill, indigo text, leading lock ("Only this is sent").
// The tags are accessibilityHidden; the StageList value summarises what was found.

import { View } from 'react-native';
import { fixed, size } from '../tokens';
import { Icon } from './Icon';
import { KText } from './KText';

export function DetectionTag({ title, state = 'found' }: { title: string; state?: 'found' | 'pending' | 'upload' }) {
  const upload = state === 'upload';
  const fg = upload ? fixed.indigo : state === 'pending' ? fixed.photoTagDimText : fixed.white;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        minHeight: size.detectionTag,
        paddingHorizontal: 12,
        borderRadius: size.detectionTag / 2,
        borderCurve: 'continuous',
        backgroundColor: upload ? fixed.lightPill : fixed.photoTag,
        borderWidth: upload ? 0 : 1,
        borderColor: fixed.photoTagBorder,
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 5,
      }}
    >
      {upload ? <Icon name="lock" size="small" color={fg} /> : null}
      <KText role="detectionTag" color={fg} numberOfLines={1}>
        {state === 'pending' ? `${title}…` : title}
      </KText>
    </View>
  );
}

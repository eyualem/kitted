// The basics silhouette with a tailor's tape (03 "TapeMeasureSilhouette", the mockup's sil()): a neutral figure,
// no face, ever. Build scales the shoulders and hips (0.9 / 1 / 1.12) and the fit eases the outline a little.
import { View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { KText, useTheme } from '@/design-system';
import { t } from '@/i18n/en';
import { buildLabel, fitLabel, heightLabel, type BasicsDraft } from './basics';

const BUILD_SCALE = { slim: 0.9, average: 1, broad: 1.12 } as const;
const FIT_EASE = { fitted: 0.96, regular: 1, relaxed: 1.06 } as const;
const BODY = 'M34,25 C25,25 19,28 17,34 L13,68 L19,69 L23,42 L24,76 L26,125 L33,125 L34,82 L36,125 L43,125 L44,76 L45,42 L49,69 L55,68 L51,34 C49,28 43,25 34,25 Z';

export function Silhouette({ basics, width }: { basics: BasicsDraft; width: number }) {
  const { colors } = useTheme();
  const sx = BUILD_SCALE[basics.build] * FIT_EASE[basics.fit];
  const height = (width * 132) / 92;
  return (
    <View style={{ alignItems: 'center', gap: 4 }} accessible accessibilityLabel={t('onb.basics.silhouetteA11y', { build: buildLabel(basics.build).toLowerCase(), fit: fitLabel(basics.fit).toLowerCase() })}>
      <Svg width={width} height={height} viewBox="0 0 92 132">
        <G fill={colors.accentSoft} stroke={colors.ink2} strokeWidth={1.2} strokeLinejoin="round">
          <Circle cx={34} cy={14.5} r={8.5} />
          <Path d={BODY} scaleX={sx} originX={34} />
        </G>
        <Rect x={69} y={3} width={12} height={126} rx={1.5} fill={colors.accentSoft} stroke={colors.accent} strokeWidth={0.8} />
        {Array.from({ length: 21 }, (_, i) => (
          <Path key={i} d={`M70,${6 + i * 6} L${i % 4 === 0 ? 76 : 73},${6 + i * 6}`} stroke={colors.accent} strokeWidth={i % 4 === 0 ? 1 : 0.7} />
        ))}
        <Path d="M34,6 L80,6" stroke={colors.accent} strokeWidth={1} strokeDasharray="2 2" />
      </Svg>
      {basics.heightIn !== null ? (
        <KText variant="caption" color="accent" mono="label">
          {heightLabel(basics.heightIn).replace(' ', '')}
        </KText>
      ) : null}
    </View>
  );
}

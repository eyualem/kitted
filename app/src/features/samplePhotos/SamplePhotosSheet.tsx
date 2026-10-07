// DEMO: the camera and the library both open this in P2 (the camera comes in P3). Twelve
// bundled photos, neck-down; a tap starts the check (or the re-check / shoe snap).
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { NeckDownPhoto, opacity } from '@/design-system';
import { DEMO_PHOTOS, SAMPLE_ORDER } from '@/demo/demoPhotos';
import { SheetScaffold } from '@/features/sheet/SheetScaffold';
import { fitCheck } from '@/features/fitcheck/session';
import type { CheckMode } from '@/features/fitcheck/machine';
import { t } from '@/i18n/en';

const W = 108;
const H = 146;

export function SamplePhotosSheet() {
  const { mode: rawMode, parent } = useLocalSearchParams<{ mode?: string; parent?: string }>();
  const mode: CheckMode = rawMode === 'recheck' || rawMode === 'shoeSnap' ? rawMode : 'check';
  const photos = SAMPLE_ORDER.map((id) => DEMO_PHOTOS.find((p) => p.id === id)!).filter(Boolean);
  const subtitle = mode === 'recheck' ? t('demo.samples.recheck') : mode === 'shoeSnap' ? t('demo.samples.snap') : t('demo.samples.sub');
  const pick = (photoId: string) => {
    router.back();
    void fitCheck.start({ mode, photoId, parentCheckId: parent });
  };
  return (
    <SheetScaffold title={t('demo.samples.title')} subtitle={subtitle}>
      <View style={styles.grid}>
        {photos.map((p, i) => (
          <Pressable
            key={p.id}
            onPress={() => pick(p.id)}
            accessibilityRole="button"
            accessibilityLabel={t('demo.samples.a11y', { n: i + 1 })}
            style={({ pressed }) => ({ opacity: pressed ? opacity.pressed : 1 })}
          >
            <NeckDownPhoto source={p.source} aspect={p.aspect} crop={p.crop} width={W} height={H} borderRadii={{ tl: 14, tr: 14, br: 14, bl: 14 }} />
          </Pressable>
        ))}
      </View>
    </SheetScaffold>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, paddingTop: 4 },
});

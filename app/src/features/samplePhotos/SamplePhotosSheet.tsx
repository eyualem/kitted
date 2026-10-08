// DEMO: the Simulator camera's library button opens this. Twelve bundled photos, neck-down; a
// tap starts the check (or the re-check / shoe snap) with its saved reading. "Choose from your
// photos" opens the system picker (no Photos permission): a real photo is prepped on the phone
// and read by Gemini in DEV builds with the key (05 §P3 C–D). Opened from the camera, a sample
// closes both the sheet and the camera; his own photo goes back to the camera for its quick check.
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { KButton, NeckDownPhoto, opacity } from '@/design-system';
import { DEMO_PHOTOS, SAMPLE_ORDER } from '@/demo/demoPhotos';
import { SheetScaffold } from '@/features/sheet/SheetScaffold';
import { handLibraryPick } from '@/features/camera/libraryInbox';
import { lensFromParams, startCheck } from '@/features/camera/startCheck';
import type { CheckMode } from '@/features/fitcheck/machine';
import { t } from '@/i18n/en';

const W = 108;
const H = 146;

export function SamplePhotosSheet() {
  const params = useLocalSearchParams<{ mode?: string; parent?: string; from?: string; occasion?: string; style?: string }>();
  const { mode: rawMode, parent, from } = params;
  const lens = lensFromParams(params);
  const close = () => (from === 'camera' ? router.dismissAll() : router.back());
  const mode: CheckMode = rawMode === 'recheck' || rawMode === 'shoeSnap' ? rawMode : 'check';
  const photos = SAMPLE_ORDER.map((id) => DEMO_PHOTOS.find((p) => p.id === id)!).filter(Boolean);
  const subtitle = mode === 'recheck' ? t('demo.samples.recheck') : mode === 'shoeSnap' ? t('demo.samples.snap') : t('demo.samples.sub');
  const pick = (photoId: string) => {
    close();
    void startCheck(mode, { photoId }, parent, lens);
  };
  const chooseOwn = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 1, exif: false });
    const uri = res.canceled ? null : res.assets[0]?.uri;
    if (!uri) return;
    // Opened from the camera: back to it for the quick check (too dark, blurry…; #100).
    if (from === 'camera' && handLibraryPick(uri)) return router.back();
    close();
    void startCheck(mode, { photoUri: uri }, parent, lens);
  };
  return (
    <SheetScaffold title={t('demo.samples.title')} subtitle={subtitle}>
      <KButton title={t('demo.samples.own')} icon="photo" kind="secondary" onPress={() => void chooseOwn()} accessibilityLabel={t('cam.a11y.library')} />
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

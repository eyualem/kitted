// DEMO: the camera and the library both open this until the camera lands (P3 A/B). Twelve
// bundled photos, neck-down; a tap starts the check (or the re-check / shoe snap). "Choose from
// your photos" opens the system picker (no Photos permission): a real photo is prepped on the
// phone and read by Gemini in DEV builds with the key (05 §P3 C–D).
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { KButton, NeckDownPhoto, opacity } from '@/design-system';
import { DEMO_PHOTOS, SAMPLE_ORDER } from '@/demo/demoPhotos';
import { SheetScaffold } from '@/features/sheet/SheetScaffold';
import { fitCheck } from '@/features/fitcheck/session';
import type { StartOutcome } from '@/features/fitcheck/service';
import { showToast } from '@/features/toast/toast';
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
    void fitCheck.start({ mode, photoId, parentCheckId: parent }).then(explain);
  };
  const chooseOwn = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 1, exif: false });
    const uri = res.canceled ? null : res.assets[0]?.uri;
    if (!uri) return;
    router.back();
    explain(await fitCheck.start({ mode, photoUri: uri, parentCheckId: parent }));
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

/** Nothing was sent: say why (02 S3 copy). A check that started shows its own card instead. */
function explain(r: StartOutcome) {
  if (r.outcome === 'photoProblem') {
    showToast(r.reason === 'noPerson' ? t('cam.retake.noPerson') : r.reason === 'multiplePeople' ? t('whichOne.q') : t('cam.retake.cantFrame'));
  } else if (r.outcome === 'unknownPhoto' || r.outcome === 'notImplemented') {
    showToast(t('demo.unknownPhoto'));
  } else if (r.outcome === 'limit') {
    showToast(t('stylist.quota.used'));
  }
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, paddingTop: 4 },
});

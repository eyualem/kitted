// DEMO: the Simulator has no camera, so the scan camera shows a drawn flat lay (a hoodie, jeans
// and sneakers on a bedsheet) in the closet's own detailed graphics (#91), like the fit camera's
// bundled photo. Each guide state for a demo screen arranges it to match (DECISIONS-LOG #100).
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { GarmentArt } from '@/features/closet/GarmentArt';
import type { ArtSpec } from '@/features/closet/artSpec';
import { demoPhoto } from '@/demo/demoPhotos';
import type { ScanTip } from '@/features/camera/guidance';
import { simPieceRects } from '@/features/camera/simGuide';

const PIECES: ArtSpec[] = [
  { shape: 'top', flat: { kind: 'top', type: 'hoodie', color: '#7E848E', pattern: { type: 'heather' }, details: { drawstrings: true, pouch: true, ribHem: true, ribCuffs: true } }, glyphs: [], a11y: '' },
  { shape: 'bottom', flat: { kind: 'bottom', type: 'jeans', color: '#3B4F6E', fit: 'straight', pattern: { type: 'twill' } }, glyphs: [], a11y: '' },
  { shape: 'shoe', flat: { kind: 'shoe', type: 'sneaker', color: '#EDEBE5' }, glyphs: [], a11y: '' },
];

export function SimFlatLay({ width, height, state }: { width: number; height: number; state: ScanTip | 'review' }) {
  if (state === 'person') {
    // Someone holding the clothes up: the fit camera's bundled photo.
    const p = demoPhoto('p01b')!;
    return <Image source={p.source} style={{ width, height }} contentFit="cover" transition={0} />;
  }
  const rects = simPieceRects(state, width, height);
  return (
    <View style={{ width, height, backgroundColor: '#E6E1D8', overflow: 'hidden' }} accessible={false} importantForAccessibility="no-hide-descendants">
      {/* faint sheet folds */}
      <View style={[styles.fold, { top: height * 0.33, transform: [{ rotate: '-4deg' }] }]} />
      <View style={[styles.fold, { top: height * 0.71, transform: [{ rotate: '3deg' }] }]} />
      {rects.map((r, i) => (
        <View key={PIECES[i]!.shape} style={{ position: 'absolute', left: r.x, top: r.y }}>
          <GarmentArt spec={PIECES[i]!} size={r.width} />
        </View>
      ))}
      {state === 'glare' ? <View style={[styles.glare, { left: width * 0.3, top: height * 0.12, width: width * 0.5, height: width * 0.5, borderRadius: width * 0.25 }]} /> : null}
      {state === 'dark' || state === 'darkTorch' ? <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.78)' }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fold: { position: 'absolute', left: -20, right: -20, height: 2, backgroundColor: 'rgba(0,0,0,0.05)' },
  glare: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.85)', shadowColor: '#fff', shadowOpacity: 1, shadowRadius: 40 },
});

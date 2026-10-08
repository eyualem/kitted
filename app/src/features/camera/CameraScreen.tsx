// S2 Camera (02 D5; mockup 5): full-screen, always dark. Propped (front camera, guide, auto
// 3-2-1) or Mirror (rear camera, manual shutter, optional 3 s timer). No live face blur: he sees himself as
// in any camera; faces are hidden after capture, in photo prep (DECISIONS-LOG #54). On a phone
// the preview and guide come from kitted-vision (KittedCameraView); on the Simulator a bundled photo stands
// in (SimulatedPreview) and the shutter "shoots" it. A capture closes the cover and starts the
// check; the photo is prepped on the phone before anything is sent (05 §P3 C).
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Linking, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconButton, KButton, KText, Numeral, cameraScrims, fixed, opacity } from '@/design-system';
import { store } from '@/data/db';
import { demoPhoto } from '@/demo/demoPhotos';
import type { CheckMode } from '@/features/fitcheck/machine';
import { t, type StringKey } from '@/i18n/en';
import {
  KittedCameraView, hasCamera, requestCameraPermission, takePhotoFrom, type CameraHandle, type CameraReadyEvent, type GuideEvent,
  type GuideState, type ViewBox,
} from '../../../modules/kitted-vision';
import { createAutoCapture, type Phase } from './autoCapture';
import { BodyOutline, LowerGuide } from './FramingOverlay';
import { lensFromParams, lensQuery, startCheck } from './startCheck';

type Mode = 'propped' | 'mirror';
const MODE_KEY = 'camera.mode';
const SIM_PHOTO = 'p01b';

const TIP: Record<GuideState, StringKey> = {
  noPerson: 'cam.tip.noPerson', tooClose: 'cam.tip.tooClose', moveLeft: 'cam.tip.moveLeft', moveRight: 'cam.tip.moveRight',
  good: 'cam.tip.good', goodFull: 'cam.tip.goodFull',
};
const isGood = (s: GuideState) => s === 'good' || s === 'goodFull';

export function CameraScreen() {
  const p = useLocalSearchParams<{ mode?: string; parent?: string; freeze?: string; occasion?: string; style?: string }>();
  // From the morning/evening card: the card's occasion and style (#61).
  const lens = lensFromParams(p);
  const checkMode: CheckMode = p.mode === 'recheck' || p.mode === 'shoeSnap' ? p.mode : 'check';
  const snap = checkMode === 'shoeSnap';
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const [mode, setMode] = useState<Mode>('propped');
  const [facing, setFacing] = useState<'front' | 'back'>(snap ? 'back' : 'front');
  const [flash, setFlash] = useState(false);
  const [timer, setTimer] = useState(false);
  const [permission, setPermission] = useState<'asking' | 'granted' | 'denied'>(hasCamera ? 'asking' : 'granted');
  // Simulator: a bundled photo stands in for the live preview.
  const sim = demoPhoto(SIM_PHOTO)!;
  const simBox = useMemo(() => simulatedBody(sim, width, height), [sim, width, height]);
  // Demo screen 5 (freeze=1): the mockup's moment, "good" and counting "3".
  const frozen = p.freeze === '1' && !KittedCameraView && !snap;
  const [guide, setGuide] = useState<GuideEvent>(frozen ? { state: 'good', body: simBox, faces: [] } : { state: 'noPerson', faces: [] });
  const [phase, setPhase] = useState<Phase>(frozen ? { kind: 'counting', n: 3 } : { kind: 'waiting' });
  const [whiteout, setWhiteout] = useState(false);
  const cam = useRef<CameraHandle>(null);
  const busy = useRef(false);

  useEffect(() => {
    void store.getKv(MODE_KEY).then((m) => {
      if ((m !== 'mirror' && m !== 'propped') || snap) return;
      setMode(m);
      setFacing(m === 'mirror' ? 'back' : 'front');
    });
    if (hasCamera) void requestCameraPermission().then(setPermission);
  }, [snap]);

  // --- capture ---------------------------------------------------------------------------
  const capture = async () => {
    if (busy.current) return;
    busy.current = true;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!KittedCameraView) {
      router.back();
      void startCheck(checkMode, { photoId: SIM_PHOTO }, p.parent, lens);
      return;
    }
    try {
      if (flash && facing === 'front') {
        setWhiteout(true); // the front "flash": a white screen lights his face and clothes
        await new Promise((r) => setTimeout(r, 250));
      }
      const shot = await takePhotoFrom(cam.current);
      setWhiteout(false);
      if (!shot) throw new Error('no photo');
      if (__DEV__) {
        const size = shot.width ? ` · ${shot.width}×${shot.height} · ${(shot.bytes / 1e6).toFixed(1)} MB · ${shot.ms} ms` : '';
        console.log(`[camera] captured (${mode}, ${facing} camera${flash ? ', flash' : ''})${size}`);
      }
      router.back();
      void startCheck(checkMode, { photoUri: shot.uri }, p.parent, lens);
    } catch {
      setWhiteout(false);
      busy.current = false;
    }
  };
  const captureRef = useRef(capture);
  useEffect(() => {
    captureRef.current = capture;
  });

  // --- auto 3-2-1 ------------------------------------------------------------------------
  const auto = useRef<ReturnType<typeof createAutoCapture> | null>(null);
  useEffect(() => {
    const a = createAutoCapture({
        setTimer: (fn, ms) => setTimeout(fn, ms),
        clearTimer: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
        onPhase: (ph) => {
          setPhase(ph);
          if (ph.kind === 'counting') {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Speech.speak(String(ph.n), { rate: 1.1 }); // he's 2–3 m away: he can't feel the tick
            AccessibilityInfo.announceForAccessibility?.(String(ph.n));
          }
        },
        onCapture: () => void captureRef.current(),
    });
    auto.current = a;
    return () => a.dispose();
  }, []);

  const autoOn = mode === 'propped' && !snap && p.freeze !== '1';
  const onGuide = (g: GuideEvent) => {
    setGuide((prev) => {
      if (prev.state !== g.state) {
        AccessibilityInfo.announceForAccessibility?.(t(TIP[g.state]));
        if (__DEV__) console.log(`[camera] guide: ${g.state}${g.faces.length ? ` · ${g.faces.length} face(s) seen` : ''}`);
      }
      return g;
    });
    if (autoOn) auto.current?.feed(isGood(g.state));
  };

  // Simulator: a scripted guide over the bundled photo (no one → too close → good → 3-2-1).
  useEffect(() => {
    if (KittedCameraView || snap || frozen) return;
    const steps: [number, GuideEvent][] = [
      [600, { state: 'tooClose', body: { ...simBox, height: simBox.height * 0.55 }, faces: [] }],
      [1800, { state: 'good', body: simBox, faces: [] }],
    ];
    const hs = steps.map(([ms, g]) => setTimeout(() => onGuide(g), ms));
    // Then steady "good" frames, like the real detector's ~10 per second.
    let keep: ReturnType<typeof setInterval> | undefined;
    const startKeep = setTimeout(() => (keep = setInterval(() => onGuide({ state: 'good', body: simBox, faces: [] }), 100)), 1800);
    return () => {
      hs.forEach(clearTimeout);
      clearTimeout(startKeep);
      if (keep) clearInterval(keep);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simBox, snap, frozen, autoOn]);

  // Mirror uses the rear camera (it sees his reflection, and it's the better camera); Propped
  // faces him. A manual flip still overrides until the next mode change (DECISIONS-LOG #82).
  const switchMode = (m: Mode) => {
    setMode(m);
    setFacing(m === 'mirror' ? 'back' : 'front');
    auto.current?.reset();
    void store.setKv(MODE_KEY, m);
  };
  const pickFromLibrary = async () => {
    if (!KittedCameraView) {
      // Simulator: the sample photos (they replay saved readings), with "Choose from your photos".
      router.push(`/sheets/sample-photos?mode=${checkMode}${p.parent ? `&parent=${p.parent}` : ''}&from=camera${lensQuery(lens)}`);
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1, exif: false });
    const uri = res.canceled ? null : res.assets[0]?.uri;
    if (!uri) return;
    router.back();
    void startCheck(checkMode, { photoUri: uri }, p.parent, lens);
  };
  const shutter = () => {
    if (mode === 'mirror' && timer && phase.kind === 'waiting') auto.current?.startCount();
    else void capture();
  };

  // --- render ----------------------------------------------------------------------------
  const tip: { icon: 'checkFilled' | 'warning' | null; text: string } = snap
    ? { icon: null, text: t('cam.shoe.tip') }
    : mode === 'mirror'
      ? { icon: null, text: t('cam.tip.mirror') }
      : { icon: isGood(guide.state) ? 'checkFilled' : guide.state === 'noPerson' ? 'warning' : null, text: t(TIP[guide.state]) };

  if (permission === 'denied') return <CameraOff onPick={() => void pickFromLibrary()} />;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      {KittedCameraView ? (
        permission === 'granted' ? (
          <KittedCameraView
            ref={cam}
            style={StyleSheet.absoluteFill}
            facing={facing}
            torch={flash && facing === 'back'}
            onGuide={(e) => onGuide(e.nativeEvent)}
            onReady={(e) => logReady(e.nativeEvent)}
          />
        ) : null
      ) : (
        <Image source={sim.source} style={StyleSheet.absoluteFill} contentFit="cover" transition={0} />
      )}

      <View style={[StyleSheet.absoluteFill, { experimental_backgroundImage: cameraScrims.top }]} pointerEvents="none" />
      <View style={[StyleSheet.absoluteFill, { experimental_backgroundImage: cameraScrims.bottom }]} pointerEvents="none" />

      {snap ? (
        <LowerGuide share={0.4} label={t('cam.shoe.guide')} width={width} height={height} />
      ) : guide.body ? (
        <BodyOutline box={guide.body} solid={isGood(guide.state)} width={width} height={height} />
      ) : null}

      {/* Top bar */}
      <View style={[styles.topBar, { top: insets.top + 3 }]}>
        <IconButton icon="close" variant="glass" diameter={44} label={t('cam.a11y.close')} onPress={() => router.back()} />
        <View style={styles.tip} accessibilityLiveRegion="polite">
          {tip.icon ? <Icon name={tip.icon} size="small" color={tip.icon === 'checkFilled' ? fixed.good : fixed.indigo} /> : null}
          <KText variant="subheadline" weight="600" color={fixed.indigo} style={{ flexShrink: 1 }} numberOfLines={2}>
            {tip.text}
          </KText>
        </View>
        {mode === 'mirror' && !snap ? (
          <IconButton icon="timer" variant="glass" diameter={44} label={timer ? t('cam.timer.on') : t('cam.timer.off')} onPress={() => setTimer(!timer)} />
        ) : (
          <IconButton icon={flash ? 'flash' : 'flashOff'} variant="glass" diameter={44} label={t('cam.a11y.flash')} onPress={() => setFlash(!flash)} />
        )}
      </View>

      {phase.kind === 'counting' ? (
        <View style={[styles.countWrap, { top: height * 0.44 - 60 }]} pointerEvents="none">
          <View style={styles.countCircle}>
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.countInner} />
            <Numeral size={75.5} color={fixed.white}>
              {String(phase.n)}
            </Numeral>
          </View>
          <KText variant="callout" weight="600" color={fixed.white} style={styles.textShadow}>
            {t('cam.countdown.hold')}
          </KText>
        </View>
      ) : null}

      {/* Bottom controls */}
      <View style={[styles.bottom, { bottom: insets.bottom + 5 }]}>
        {!snap ? (
          <View style={styles.modeSwitch} accessibilityRole="tablist" accessibilityLabel={t('cam.mode.propped')}>
            {(['propped', 'mirror'] as const).map((m) => (
              <Pressable
                key={m}
                onPress={() => switchMode(m)}
                accessibilityRole="tab"
                accessibilityState={{ selected: mode === m }}
                style={[styles.modeSeg, mode === m && { backgroundColor: 'rgba(255,255,255,0.95)' }]}
              >
                <KText variant="subheadline" weight="600" color={mode === m ? fixed.indigo : 'rgba(255,255,255,0.75)'}>
                  {t(m === 'propped' ? 'cam.mode.propped' : 'cam.mode.mirror')}
                </KText>
              </Pressable>
            ))}
          </View>
        ) : null}
        <View style={styles.controls}>
          {!snap ? <IconButton icon="photo" variant="glass" diameter={52} label={t('cam.a11y.library')} onPress={() => void pickFromLibrary()} /> : <View style={{ width: 52 }} />}
          <Pressable
            onPress={shutter}
            accessibilityRole="button"
            accessibilityLabel={snap ? t('cam.shoe.a11yShutter') : t('cam.a11y.shutter')}
            style={({ pressed }) => [styles.shutter, { opacity: pressed ? opacity.pressed : 1 }]}
          >
            <View style={styles.shutterDisc} />
          </Pressable>
          <IconButton icon="flip" variant="glass" diameter={52} label={t('cam.a11y.flip')} onPress={() => setFacing(facing === 'front' ? 'back' : 'front')} />
        </View>
      </View>

      {whiteout ? <View style={[StyleSheet.absoluteFill, { backgroundColor: fixed.white }]} pointerEvents="none" /> : null}
    </View>
  );
}

/** S18 inside the cover: the camera is off; he can still choose a photo. */
function CameraOff({ onPick }: { onPick: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { justifyContent: 'center', padding: 24, gap: 16 }]}>
      <StatusBar style="light" />
      <View style={{ position: 'absolute', top: insets.top + 3, left: 18 }}>
        <IconButton icon="close" variant="glass" diameter={44} label={t('cam.a11y.close')} onPress={() => router.back()} />
      </View>
      <Icon name="camera" size={44} color={fixed.white} />
      <KText variant="body" color={fixed.white}>
        {t('camOff.text')}
      </KText>
      <KButton title={t('camOff.choose')} onPress={onPick} />
      <KButton title={t('common.openSettings')} kind="secondary" onPress={() => void Linking.openSettings()} />
    </View>
  );
}

function logReady(r: CameraReadyEvent) {
  if (!__DEV__) return;
  const extra = r.photo
    ? ` · photo ${r.photo} · frames ${r.frames ?? '?'} · zsl ${r.zsl ? 'on' : 'off'} · thermal ${r.thermal ?? '?'} · sizes ${(r.photoSizes ?? []).join(', ')}`
    : ' · (older native build: reinstall for 12 MP)';
  console.log(`[camera] ready · ${r.facing}${extra}`);
}

/** Where the body sits in the bundled photo under `cover` (the mockup's PH crop table). */
function simulatedBody(photo: NonNullable<ReturnType<typeof demoPhoto>>, W: number, H: number): ViewBox {
  const iw = photo.aspect, ih = 1;
  const s = Math.max(W / iw, H / ih);
  const dw = iw * s, dh = ih * s;
  const ox = (dw - W) / 2, oy = (dh - H) / 2;
  const top = Math.max(0, photo.crop.neck - 0.1) * dh - oy;
  const bottom = Math.min(1, photo.crop.foot + 0.02) * dh - oy;
  const cx = photo.crop.cx * dw - ox;
  const w = (bottom - top) * 0.34;
  return { x: cx - w / 2, y: top, width: w, height: bottom - top };
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: fixed.black },
  topBar: { position: 'absolute', left: 18, right: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  tip: {
    flexShrink: 1, minHeight: 36.5, borderRadius: 18, paddingHorizontal: 14.5, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.92)',
    flexDirection: 'row', alignItems: 'center', gap: 6.5,
  },
  countWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: 8 },
  countCircle: {
    width: 119.5, height: 119.5, borderRadius: 60, borderWidth: 3, borderColor: 'rgba(255,255,255,0.9)', backgroundColor: 'rgba(10,12,20,0.35)',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  countInner: { position: 'absolute', top: 5, left: 5, right: 5, bottom: 5, borderRadius: 60, borderWidth: 8, borderColor: 'rgba(255,255,255,0.12)' },
  textShadow: { textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 6 },
  bottom: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: 21, paddingBottom: 34 },
  modeSwitch: { flexDirection: 'row', padding: 4, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.4)' },
  modeSeg: { paddingVertical: 6.5, paddingHorizontal: 15.5, borderRadius: 17, minHeight: 32, justifyContent: 'center' },
  controls: { alignSelf: 'stretch', paddingHorizontal: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  shutter: { width: 88.5, height: 88.5, borderRadius: 44.25, borderWidth: 4.5, borderColor: fixed.white, alignItems: 'center', justifyContent: 'center' },
  shutterDisc: { width: 70, height: 70, borderRadius: 35, backgroundColor: fixed.white },
});

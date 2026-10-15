// S2 Camera (02 D5; mockup 5): full-screen, always dark. Propped (front camera, guide, auto
// 3-2-1) or Mirror (rear camera, manual shutter, optional 3 s timer). No live face blur: he sees himself as
// in any camera; faces are hidden after capture, in photo prep (DECISIONS-LOG #54). On a phone
// the preview and guide come from kitted-vision (KittedCameraView); on the Simulator a bundled photo stands
// in (SimulatedPreview) and the shutter "shoots" it. Guidance (DECISIONS-LOG #100): the tip pill
// follows guidance.ts (light, framing, distance, motion), offers the flash when it's dark and is
// spoken in Propped; after a capture or a library pick a quick check opens the S3 panel when the
// photo is too dark, blurry or backlit (Retake / Use anyway) or can't be sent (no person, a face
// we can't hide). Otherwise the cover closes and the check starts; the photo is prepped on the
// phone before anything is sent (05 §P3 C).
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Linking, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { File } from 'expo-file-system';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconButton, KButton, KText, Numeral, cameraScrims, fixed, opacity, size, space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import { demoPhoto } from '@/demo/demoPhotos';
import type { CheckMode } from '@/features/fitcheck/machine';
import { t } from '@/i18n/en';
import {
  KittedCameraView, assess, hasCamera, requestCameraPermission, takePhotoFrom, type CameraHandle, type CameraReadyEvent, type GuideEvent,
  type ViewBox,
} from '../../../modules/kitted-vision';
import { createAutoCapture, type Phase } from './autoCapture';
import { BodyOutline, LowerGuide } from './FramingOverlay';
import { createTipFilter, fitIssue, fitTip, type FitTip, type Issue } from './guidance';
import { fitTipCopy, isSpokenTip, issueTitle } from './guidanceCopy';
import { RetakePanel } from './RetakePanel';
import { assessLine, simFitEvent, simIssue } from './simGuide';
import { lensFromParams, lensQuery, startCheck, type PhotoInput } from './startCheck';
import { guideLog } from './devLog';
import { onLibraryPick } from './libraryInbox';
import { Asset } from 'expo-asset';

type Mode = 'propped' | 'mirror';
const MODE_KEY = 'camera.mode';
const SIM_PHOTO = 'p01b';

const FIT_TIPS: readonly FitTip[] = ['dark', 'darkFlash', 'noPerson', 'mirrorAim', 'backlit', 'tooClose', 'tooFar', 'moveLeft', 'moveRight', 'moving', 'good', 'goodFull'];
const isGoodTip = (tip: FitTip) => tip === 'good' || tip === 'goodFull' || tip === 'darkFlash';
/** Problem tips are spoken at most this often (Propped), and not in the first moment after opening. */
const SPEAK_GAP_MS = 4000;
const SPEAK_AFTER_OPEN_MS = 1200;

/** The photo under review (S3): his file (camera or library) or, on the Simulator, the bundled one. */
interface Review {
  photo: PhotoInput;
  source: 'camera' | 'library';
  issue: Issue | null;
}

export function CameraScreen() {
  const { isAccessibilitySize } = useTheme();
  const p = useLocalSearchParams<{ mode?: string; parent?: string; freeze?: string; occasion?: string; style?: string; guide?: string; review?: string; camMode?: string }>();
  // From the morning/evening card: the card's occasion and style (#61).
  const lens = lensFromParams(p);
  const checkMode: CheckMode = p.mode === 'recheck' || p.mode === 'shoeSnap' ? p.mode : 'check';
  const snap = checkMode === 'shoeSnap';
  // Re-check: one plain note (founder, Oct 14: naming one piece, "Re-check · pants", read as if the rest were ignored).
  // The whole photo is read again; the fixed pieces and any swapped piece count, the rest keeps its first reading.
  const recheckNote = checkMode === 'recheck' ? { title: t('cam.recheck.title'), body: t('cam.recheck.body') } : null;
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
  // Demo screen 5 (freeze=1): the mockup's moment, "good" and counting "3". Demo screens 41–44:
  // one tip held (?guide=) or the after-shot panel (?review=), on the Simulator only.
  const frozen = p.freeze === '1' && !KittedCameraView && !snap;
  const simTip = !KittedCameraView ? FIT_TIPS.find((x) => x === p.guide) : undefined;
  const [guide, setGuide] = useState<GuideEvent>(frozen ? { state: 'good', body: simBox, faces: [] } : { state: 'noPerson', faces: [] });
  const [tip, setTip] = useState<FitTip>(frozen ? 'good' : 'noPerson');
  const [offerFlash, setOfferFlash] = useState(false);
  const [phase, setPhase] = useState<Phase>(frozen ? { kind: 'counting', n: 3 } : { kind: 'waiting' });
  const [whiteout, setWhiteout] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const [checking, setChecking] = useState(false);
  // Where the bottom controls start (measured), so the body guide ends above them.
  const [controlsTop, setControlsTop] = useState<number | null>(null);
  const cam = useRef<CameraHandle>(null);
  const busy = useRef(false);
  const filter = useRef(createTipFilter<FitTip>());
  const opened = useRef(0);
  const lastSpoken = useRef(0);
  // The guide handler runs from native events; it reads the current mode and flash from here.
  const live = useRef({ mode, flash, counting: false });
  useEffect(() => {
    live.current = { mode, flash, counting: phase.kind === 'counting' };
  }, [mode, flash, phase.kind]);

  useEffect(() => {
    opened.current = Date.now();
  }, []);
  useEffect(() => {
    void store.getKv(MODE_KEY).then((m) => {
      if (p.camMode === 'mirror' || p.camMode === 'propped') m = p.camMode;
      if ((m !== 'mirror' && m !== 'propped') || snap) return;
      setMode(m);
      setFacing(m === 'mirror' ? 'back' : 'front');
    });
    if (hasCamera) void requestCameraPermission().then(setPermission);
  }, [snap, p.camMode]);

  // --- capture and the quick check (S3) ----------------------------------------------------
  const finish = (photo: PhotoInput) => {
    router.back();
    void startCheck(checkMode, photo, p.parent, lens);
  };
  /** The quick check: nothing to say → the check starts; otherwise the S3 panel. */
  const reviewPhoto = async (photo: PhotoInput, source: Review['source']) => {
    if (!('photoUri' in photo)) return finish(photo);
    setReview({ photo, source, issue: null });
    setChecking(true);
    const a = await assess(photo.photoUri, 'fit');
    setChecking(false);
    const issue = fitIssue(a, { needsPerson: !snap });
    if (__DEV__) guideLog(`[guide] after the shot (${source}) → ${issue ? `${issue.reason}${issue.allowUse ? '' : ', not sendable'}` : 'fine'} · ${assessLine(a)}`);
    if (!issue) return finish(photo);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setReview({ photo, source, issue });
  };
  const discard = () => {
    // His photo isn't used: the temporary file goes now (prep deletes it only when it's used).
    if (review && 'photoUri' in review.photo) {
      try {
        new File(review.photo.photoUri).delete();
      } catch {
        // already gone
      }
    }
    setReview(null);
    busy.current = false;
    auto.current?.reset();
  };

  const capture = async () => {
    if (busy.current) return;
    busy.current = true;
    // The shot is taken: a tip or count still being spoken is stale (#276).
    void Speech.stop();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!KittedCameraView) {
      // Simulator: the bundled photo. A demo screen can ask for the panel (?review=).
      const forced = simIssue(p.review);
      if (forced) setReview({ photo: { photoId: SIM_PHOTO }, source: 'camera', issue: forced });
      else {
        if (__DEV__) void simAssess(sim.source);
        finish({ photoId: SIM_PHOTO });
      }
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
        const dims = shot.width ? ` · ${shot.width}×${shot.height} · ${(shot.bytes / 1e6).toFixed(1)} MB · ${shot.ms} ms` : '';
        console.log(`[camera] captured (${mode}, ${facing} camera${flash ? ', flash' : ''})${dims}`);
      }
      await reviewPhoto({ photoUri: shot.uri }, 'camera');
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
    return () => {
      a.dispose();
      // Closing the camera stops anything it was saying (#276).
      void Speech.stop();
    };
  }, []);

  const autoOn = mode === 'propped' && !snap && p.freeze !== '1' && !simTip && !review;
  const autoOnRef = useRef(autoOn);
  useEffect(() => {
    autoOnRef.current = autoOn;
  }, [autoOn]);
  const lastLog = useRef(0);
  const onGuide = (g: GuideEvent) => {
    setGuide(g);
    const { mode: m, flash: f, counting } = live.current;
    const r = fitTip(g, { mode: m, flash: f });
    const now = Date.now();
    const prev = filter.current.shown;
    const shown = filter.current.feed(r.tip, now);
    setOfferFlash(r.offerFlash);
    if (shown !== prev) {
      setTip(shown);
      const text = fitTipCopy(shown).text;
      AccessibilityInfo.announceForAccessibility?.(text);
      // He's 2–3 m away in Propped and can't read the pill (02 D5: "spoken once per change, throttled").
      if (m === 'propped' && !counting && isSpokenTip(shown) && now - opened.current > SPEAK_AFTER_OPEN_MS && now - lastSpoken.current > SPEAK_GAP_MS) {
        lastSpoken.current = now;
        Speech.speak(text, { rate: 1.0 });
      }
      if (__DEV__) guideLog(`[guide] ${shown}${g.faces.length ? ` · ${g.faces.length} face(s) seen` : ''}`);
    }
    // DEV: the raw measures every 2 s, to tune the thresholds from the phone (#100).
    if (__DEV__ && g.luma !== undefined && now - lastLog.current > 2000) {
      lastLog.current = now;
      const f3 = (v?: number) => (v === undefined ? '–' : v.toFixed(3));
      guideLog(`[guide] luma ${f3(g.luma)} · him ${f3(g.subjectLuma)} · clipped ${f3(g.clipped)} · iso ${Math.round(g.iso ?? 0)}/${Math.round(g.maxIso ?? 0)} · 1/${g.exposure ? Math.round(1 / g.exposure) : '?'} s · motion ${f3(g.motion)} · body ${f3(g.bodyShare)}`);
    }
    if (autoOnRef.current) auto.current?.feed(r.ready && isGoodTip(shown));
  };

  // Simulator: one tip held for a demo screen (?guide=<tip>), or the review panel (?review=).
  useEffect(() => {
    if (KittedCameraView || snap || frozen) return;
    if (simTip) {
      const h = setInterval(() => onGuide(simFitEvent(simTip, simBox)), 100);
      return () => clearInterval(h);
    }
    if (p.review) {
      const h = setTimeout(() => void capture(), 300);
      return () => clearTimeout(h);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simTip, p.review, simBox, snap, frozen]);

  // Simulator: a scripted guide over the bundled photo (no one → too close → good → 3-2-1).
  useEffect(() => {
    if (KittedCameraView || snap || frozen || simTip || p.review) return;
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
      // Simulator: the sample photos (they replay saved readings), with "Choose from your photos"
      // (that pick comes back here for the quick check, through libraryInbox).
      router.push(`/sheets/sample-photos?mode=${checkMode}${p.parent ? `&parent=${p.parent}` : ''}&from=camera${lensQuery(lens)}`);
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1, exif: false });
    const uri = res.canceled ? null : res.assets[0]?.uri;
    if (!uri) return;
    busy.current = true;
    await reviewPhoto({ photoUri: uri }, 'library');
  };
  // A photo chosen in the Simulator's sample sheet ("Choose from your photos") gets the same check.
  useEffect(
    () =>
      onLibraryPick((uri) => {
        busy.current = true;
        void reviewPhoto({ photoUri: uri }, 'library');
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const shutter = () => {
    if (mode === 'mirror' && timer && phase.kind === 'waiting') auto.current?.startCount();
    else void capture();
  };

  // --- render ----------------------------------------------------------------------------
  const tipView = review ? { icon: null, text: t('cam.checking') } : snap ? { icon: null, text: t('cam.shoe.tip') } : fitTipCopy(tip);
  const reviewUri = review && 'photoUri' in review.photo ? review.photo.photoUri : null;
  const panel = review?.issue ? reviewPanel(review.issue) : null;
  // The S3 panel says what's wrong; the "Checking the photo…" pill goes while it shows.
  const panelShown = !!(review && !checking && panel);
  // The free band for the body guide: under the top bar, above the mode switch and shutter.
  const guideTop = insets.top + 3 + size.navCircle + space.s;
  const guideBottom = (controlsTop ?? height - insets.bottom - 190) - space.s;
  function reviewPanel(issue: Issue) {
    const lib = review?.source === 'library';
    const withFlash = issue.reason === 'dark' && !flash && !lib;
    const primary = lib
      ? { title: t('cam.retake.chooseAnother'), icon: 'photo' as const, onPress: () => { discard(); void pickFromLibrary(); } }
      : withFlash
        ? { title: t('cam.retake.withFlash'), icon: 'flash' as const, onPress: () => { setFlash(true); discard(); } }
        : { title: t('cam.retake.retake'), onPress: discard };
    const use = issue.allowUse && review ? { title: t('cam.retake.useAnyway'), onPress: () => finish(review.photo) } : undefined;
    return <RetakePanel title={issueTitle(issue, 'fit')} body={t('cam.retake.noCount')} primary={primary} secondary={use} />;
  }

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
        <>
          <Image source={sim.source} style={StyleSheet.absoluteFill} contentFit="cover" transition={0} />
          {/* DEMO: the bundled photo stays bright; the dark demo states dim it like a dark room would. */}
          {simTip === 'dark' || simTip === 'darkFlash' || p.review === 'dark' ? <View style={[StyleSheet.absoluteFill, { backgroundColor: fixed.demoDim }]} /> : null}
        </>
      )}

      {reviewUri ? <Image source={{ uri: reviewUri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={0} /> : null}

      <View style={[StyleSheet.absoluteFill, { experimental_backgroundImage: cameraScrims.top }]} pointerEvents="none" />
      <View style={[StyleSheet.absoluteFill, { experimental_backgroundImage: cameraScrims.bottom }]} pointerEvents="none" />

      {snap ? (
        <LowerGuide share={0.4} label={t('cam.shoe.guide')} width={width} height={height} />
      ) : guide.body && !review ? (
        <BodyOutline box={guide.body} solid={isGoodTip(tip)} width={width} height={height} minY={guideTop} maxY={guideBottom} />
      ) : null}

      {/* Top bar */}
      <View style={[styles.topBar, { top: insets.top + 3 }]}>
        <IconButton icon="close" variant="glass" diameter={44} label={t('cam.a11y.close')} onPress={() => router.back()} />
        {panelShown ? (
          <View style={styles.tipSpacer} />
        ) : (
          <View style={styles.tip} accessibilityLiveRegion="polite">
            {tipView.icon ? <Icon name={tipView.icon} size="small" color={tipView.icon === 'checkFilled' ? fixed.good : fixed.indigo} /> : null}
            <KText variant="subheadline" weight="600" color={fixed.indigo} style={{ flexShrink: 1 }} numberOfLines={isAccessibilitySize ? 0 : 2}>
              {tipView.text}
            </KText>
          </View>
        )}
        {mode === 'mirror' && !snap ? (
          <IconButton icon="timer" variant="glass" diameter={44} label={timer ? t('cam.timer.on') : t('cam.timer.off')} onPress={() => setTimer(!timer)} />
        ) : (
          <IconButton icon={flash ? 'flash' : 'flashOff'} variant="glass" diameter={44} label={t(flash ? 'cam.a11y.flashOn' : 'cam.a11y.flashOff')} onPress={() => setFlash(!flash)} />
        )}
      </View>

      {offerFlash && !flash && !review && !snap ? (
        <View style={[styles.offerWrap, { top: insets.top + 3 + 52 }]}>
          <Pressable onPress={() => setFlash(true)} accessibilityRole="button" style={({ pressed }) => [styles.offer, { opacity: pressed ? opacity.pressed : 1 }]}>
            <Icon name="flash" size="small" color={fixed.white} />
            <KText variant="subheadline" weight="600" color={fixed.white}>
              {t('cam.flashOffer')}
            </KText>
          </Pressable>
        </View>
      ) : null}

      {phase.kind === 'counting' ? (
        <View style={[styles.countWrap, { top: height * 0.44 - 60 }]} pointerEvents="none">
          <View style={styles.countCircle}>
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.countInner} />
            <Numeral size={76} color={fixed.white}>
              {String(phase.n)}
            </Numeral>
          </View>
          <View style={styles.holdTag}>
            <KText variant="callout" weight="600" color={fixed.white}>
              {t('cam.countdown.hold')}
            </KText>
          </View>
        </View>
      ) : null}

      {/* Bottom controls */}
      <View style={[styles.bottom, { bottom: insets.bottom + 5 }]} onLayout={(e) => setControlsTop(e.nativeEvent.layout.y)}>
        {recheckNote && !panelShown ? (
          <View style={styles.recheckNote} accessible accessibilityLabel={`${recheckNote.title}. ${recheckNote.body}`}>
            <KText variant="subheadline" weight="600" color={fixed.white}>
              {recheckNote.title}
            </KText>
            <KText variant="footnote" color={fixed.white} style={{ opacity: 0.85, textAlign: 'center' }}>
              {recheckNote.body}
            </KText>
          </View>
        ) : null}
        {!snap ? (
          <View style={styles.modeSwitch} accessibilityRole="tablist" accessibilityLabel={t('cam.a11y.mode')}>
            {(['propped', 'mirror'] as const).map((m) => (
              <Pressable
                key={m}
                onPress={() => switchMode(m)}
                accessibilityRole="tab"
                accessibilityLabel={t(m === 'propped' ? 'cam.mode.propped' : 'cam.mode.mirror')}
                accessibilityState={{ selected: mode === m }}
                // 32 pt pill + the track's padding: the slop brings the target to 44 pt.
                hitSlop={{ top: 6, bottom: 6 }}
                style={[styles.modeSeg, mode === m && { backgroundColor: fixed.lightPill }]}
              >
                <KText variant="subheadline" weight="600" color={mode === m ? fixed.indigo : fixed.modeSwitchLabel}>
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
      {review && !checking ? panel : null}
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

/** DEV, Simulator: the real quick check on the bundled photo, logged (it proves the native check
 *  runs here; the demo still scores the bundled photo's saved reading). */
async function simAssess(source: number | string | object) {
  try {
    const asset = typeof source === 'number' ? await Asset.fromModule(source).downloadAsync() : null;
    if (!asset?.localUri) return;
    const a = await assess(asset.localUri, 'fit');
    guideLog(`[guide] simulator check of the bundled photo → ${fitIssue(a)?.reason ?? 'fine'} · ${assessLine(a)}`);
  } catch (e) {
    guideLog(`[guide] simulator check failed: ${String(e)}`);
  }
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
    flexShrink: 1, minHeight: size.button, borderRadius: size.button / 2, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: fixed.lightPill,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  tipSpacer: { flex: 1 },
  countWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: 8 },
  countCircle: {
    width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: fixed.countdownRing, backgroundColor: fixed.countdownBacking,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  countInner: { position: 'absolute', top: 5, left: 5, right: 5, bottom: 5, borderRadius: 60, borderWidth: 8, borderColor: fixed.countdownInnerRing },
  // "Hold still" on a photo tag (03 §2.3: a text shadow alone was 1.0 over white).
  holdTag: {
    minHeight: size.detectionTag, borderRadius: size.detectionTag / 2, paddingHorizontal: space.m, paddingVertical: space.xs, justifyContent: 'center',
    backgroundColor: fixed.photoTag, borderWidth: 1, borderColor: fixed.photoTagBorder,
  },
  offerWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  offer: {
    flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: size.button, paddingHorizontal: 14, borderRadius: size.button / 2, backgroundColor: fixed.offerPill,
    borderWidth: 1, borderColor: fixed.offerPillBorder,
  },
  bottom: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: space.xl, paddingBottom: 34 },
  recheckNote: { alignItems: 'center', gap: 2, maxWidth: 320, paddingHorizontal: space.l, paddingVertical: space.s, borderRadius: 16, backgroundColor: fixed.modeSwitchBacking, marginBottom: -space.m },
  modeSwitch: { flexDirection: 'row', padding: space.xs, borderRadius: 20, backgroundColor: fixed.modeSwitchBacking },
  modeSeg: { paddingVertical: 6, paddingHorizontal: space.l, borderRadius: 16, minHeight: 32, justifyContent: 'center' },
  controls: { alignSelf: 'stretch', paddingHorizontal: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  shutter: { width: 88, height: 88, borderRadius: 44, borderWidth: 4, borderColor: fixed.white, alignItems: 'center', justifyContent: 'center' },
  shutterDisc: { width: 70, height: 70, borderRadius: 35, backgroundColor: fixed.white },
});

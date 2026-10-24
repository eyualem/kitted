// Scan clothes (C4 "Take photo" / "Choose photos"; DECISIONS-LOG #88, #100): a full-screen camera,
// always dark, rear camera. The preview is sized to the photo's own 4:3, so what he sees is exactly
// what's saved. Live tips (too dark + torch, a person in view, no clothes, hold still, glare, a
// piece cut off, too far, "{n} pieces in view") come from guidance.ts; each piece found gets corner
// brackets. After the shot (or a library pick) a quick check opens the S3 panel when something's
// off; then the photo is prepped on the phone (any face hidden) and saved to the scan inbox. Reading
// clothes from photos isn't built yet (style-council session), and the "Saved" panel says so.
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Linking, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { File } from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconButton, KButton, KText, fixed, opacity, size, space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import { t } from '@/i18n/en';
import {
  KittedCameraView, assess, hasCamera, requestCameraPermission, takePhotoFrom, type CameraHandle, type GuideEvent, type ScanPiece,
} from '../../../modules/kitted-vision';
import { flashControls } from '@/features/camera/cameraControls';
import { guideLog } from '@/features/camera/devLog';
import { createExposureClock, createTipFilter, scanIssue, scanPieces, scanTip, type Issue, type ScanTip } from '@/features/camera/guidance';
import { issueTitle, scanTipCopy } from '@/features/camera/guidanceCopy';
import { RetakePanel } from '@/features/camera/RetakePanel';
import { assessLine, simIssue, simScanEvent } from '@/features/camera/simGuide';
import { saveDemoScan, saveScan } from './inbox';
import { saveOutcome } from './saveOutcome';
import { SimFlatLay } from './SimFlatLay';

const SCAN_TIPS: readonly ScanTip[] = ['looking', 'dark', 'darkTorch', 'person', 'noClothes', 'moving', 'glare', 'cutOff', 'tooFar', 'good'];
const LIBRARY_LIMIT = 10;

type Stage =
  | { kind: 'live' }
  | { kind: 'checking'; uri: string | null }
  | { kind: 'issue'; uri: string | null; issue: Issue; source: 'camera' | 'library' }
  | { kind: 'batch'; items: { uri: string; issue: Issue | null }[] }
  | { kind: 'saved'; count: number }
  | { kind: 'notSaved'; many: boolean; source: 'camera' | 'library' };

export function ScanCameraScreen() {
  const p = useLocalSearchParams<{ guide?: string; review?: string; saved?: string; library?: string }>();
  const { isAccessibilitySize } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const sim = !KittedCameraView;
  const simTip = sim ? SCAN_TIPS.find((x) => x === p.guide) : undefined;

  // The preview is exactly 3:4 (the photo), under the top bar; smaller on short phones.
  const top = insets.top + 3 + 44 + 14;
  const room = height - top - insets.bottom - 176;
  const pw = Math.min(width, Math.floor((room * 3) / 4));
  const ph = Math.round((pw * 4) / 3);
  const left = (width - pw) / 2;

  const [permission, setPermission] = useState<'asking' | 'granted' | 'denied'>(hasCamera ? 'asking' : 'granted');
  const [torch, setTorch] = useState(false);
  const [guide, setGuide] = useState<GuideEvent>({ state: 'noPerson', faces: [] });
  const [tip, setTip] = useState<{ tip: ScanTip; count: number }>({ tip: 'looking', count: 0 });
  const [offerFlash, setOfferFlash] = useState(false);
  // Demo screens open on the after-shot panel (?review=<reason>) or the Saved panel (?saved=1).
  const [stage, setStage] = useState<Stage>(() => {
    const forced = sim ? simIssue(p.review) : null;
    if (forced) return { kind: 'issue', uri: null, issue: forced, source: 'camera' };
    return sim && p.saved ? { kind: 'saved', count: Number(p.saved) || 1 } : { kind: 'live' };
  });
  const cam = useRef<CameraHandle>(null);
  const busy = useRef(false);
  const filter = useRef(createTipFilter<ScanTip>());
  const exposure = useRef(createExposureClock());
  const torchRef = useRef(torch);
  const lastLog = useRef(0);
  useEffect(() => {
    torchRef.current = torch;
  }, [torch]);

  useEffect(() => {
    if (hasCamera) void requestCameraPermission().then(setPermission);
  }, []);


  // --- live tips ---------------------------------------------------------------------------
  const onGuide = (g: GuideEvent) => {
    setGuide(g);
    const now = Date.now();
    const r = scanTip(g, { torch: torchRef.current, settling: exposure.current.settling(now) });
    const prev = filter.current.shown;
    const shown = filter.current.feed(r.tip, now);
    setOfferFlash(r.offerFlash);
    setTip({ tip: shown, count: r.count });
    if (shown !== prev) {
      AccessibilityInfo.announceForAccessibility?.(scanTipCopy(shown, r.count).text);
      if (__DEV__) guideLog(`[guide] scan: ${shown}${shown === 'good' ? ` (${r.count})` : ''}`);
    }
    if (__DEV__ && g.luma !== undefined && now - lastLog.current > 2000) {
      lastLog.current = now;
      const f3 = (v?: number) => (v === undefined ? '–' : v.toFixed(3));
      const s = g.scan;
      guideLog(
        `[guide] scan luma ${f3(g.luma)} · clipped ${f3(g.clipped)} · iso ${Math.round(g.iso ?? 0)}/${Math.round(g.maxIso ?? 0)} · motion ${f3(g.motion)}` +
          (s ? ` · people ${s.people.map((x) => x.toFixed(2)).join(',') || '0'} · clothes ${f3(s.clothes)} · pieces ${s.pieces.map((x) => `${x.share.toFixed(3)}${x.edge ? ' edge' : ''}`).join(', ') || 'none'} · ${(s.labels ?? []).join('; ')}` : ' · (no scan measures yet)'),
      );
    }
  };

  // Simulator: one state held for a demo screen (?guide=), else "Looking…" then three pieces.
  useEffect(() => {
    if (!sim) return;
    const state = simTip ?? 'good';
    const start = setTimeout(() => {
      onGuide(simScanEvent(simTip ? state : 'looking', pw, ph));
    }, 0);
    const h = setInterval(() => onGuide(simScanEvent(state, pw, ph)), 100);
    return () => {
      clearTimeout(start);
      clearInterval(h);
    };
  }, [sim, simTip, pw, ph]);

  // --- capture, check, save ------------------------------------------------------------------
  const deleteFiles = (uris: (string | null)[]) => {
    for (const u of uris) {
      if (!u) continue;
      try {
        new File(u).delete();
      } catch {
        // already gone (prep deletes the files it used)
      }
    }
  };

  const save = async (uris: string[], source: 'camera' | 'library') => {
    let saved = 0;
    for (const uri of uris) {
      const r = await saveScan(store, uri, source, source === 'camera' ? tip.count : null, Date.now());
      if (__DEV__) guideLog(`[scan] saved (${source}) → ${r.status}${r.status === 'saved' ? ` · ${r.entry.keptPath}` : ''}`);
      if (r.status === 'saved') saved += 1;
      else if (r.status === 'cantHide' && uris.length === 1) {
        // The quick check missed a face we can't hide: nothing is kept for sending (ruling 10).
        setStage({ kind: 'issue', uri, issue: { reason: 'cantHide', allowUse: false }, source });
        return;
      }
    }
    const out = saveOutcome(saved, uris.length);
    void Haptics.notificationAsync(out.kind === 'saved' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error);
    setStage(out.kind === 'saved' ? out : { ...out, source });
  };

  const review = async (uri: string, source: 'camera' | 'library') => {
    setStage({ kind: 'checking', uri });
    const a = await assess(uri, 'scan');
    const issue = scanIssue(a);
    if (__DEV__) guideLog(`[guide] scan after the shot (${source}) → ${issue?.reason ?? 'fine'} · ${assessLine(a)}`);
    if (!issue) return save([uri], source);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setStage({ kind: 'issue', uri, issue, source });
  };

  const capture = async () => {
    if (busy.current || stage.kind !== 'live') return;
    busy.current = true;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (sim) {
      await saveDemoScan(store, Date.now());
      setStage({ kind: 'saved', count: 1 });
      return;
    }
    try {
      const shot = await takePhotoFrom(cam.current);
      if (!shot) throw new Error('no photo');
      if (__DEV__) guideLog(`[camera] scan captured${shot.width ? ` · ${shot.width}×${shot.height} · ${(shot.bytes / 1e6).toFixed(1)} MB · ${shot.ms} ms` : ''}${torch ? ' · torch' : ''}`);
      await review(shot.uri, 'camera');
    } catch {
      busy.current = false;
      setStage({ kind: 'live' });
    }
  };

  const pickFromLibrary = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1, exif: false, allowsMultipleSelection: true, selectionLimit: LIBRARY_LIMIT });
    const uris = res.canceled ? [] : res.assets.map((a) => a.uri);
    if (uris.length === 0) return;
    busy.current = true;
    if (uris.length === 1) return review(uris[0]!, 'library');
    setStage({ kind: 'checking', uri: null });
    const items: { uri: string; issue: Issue | null }[] = [];
    for (const uri of uris) {
      const a = await assess(uri, 'scan');
      const issue = scanIssue(a);
      if (__DEV__) guideLog(`[guide] scan library ${items.length + 1}/${uris.length} → ${issue?.reason ?? 'fine'} · ${assessLine(a)}`);
      items.push({ uri, issue });
    }
    if (items.every((i) => !i.issue)) return save(uris, 'library');
    setStage({ kind: 'batch', items });
  };

  // Closet "+" → Choose photos: the picker opens over the scan camera at once.
  const libraryOpened = useRef(false);
  useEffect(() => {
    if (p.library !== '1' || libraryOpened.current) return;
    libraryOpened.current = true;
    const h = setTimeout(() => void pickFromLibrary(), 450);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.library]);

  const backToLive = () => {
    if (stage.kind === 'issue') deleteFiles([stage.uri]);
    if (stage.kind === 'batch') deleteFiles(stage.items.map((i) => i.uri));
    busy.current = false;
    setStage({ kind: 'live' });
  };

  // --- render ----------------------------------------------------------------------------
  if (permission === 'denied') return <ScanCameraOff onPick={() => void pickFromLibrary()} />;

  const frozen = stage.kind === 'issue' || stage.kind === 'checking' ? stage.uri : null;
  const live = stage.kind === 'live';
  // One flash control at a time (C6, #287), as in the fit-check camera.
  const flashUi = flashControls({ offered: offerFlash, flash: torch, canOffer: live, timerSlot: false });
  const tipView = stage.kind === 'checking' ? { text: t('cam.checking'), icon: null } : scanTipCopy(tip.tip, tip.count);
  const pieces = live ? scanPieces(guide.scan?.pieces) : [];
  // DEMO: the drawn flat lay matches the state (the after-shot panel shows the photo with the problem).
  const reviewTip = stage.kind === 'issue' ? SCAN_TIPS.find((x) => x === stage.issue.reason) : undefined;
  const simState: ScanTip | 'review' = simTip ?? reviewTip ?? (stage.kind === 'live' ? (tip.tip === 'looking' ? 'looking' : 'good') : 'review');

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <View style={{ position: 'absolute', top, left, width: pw, height: ph, borderRadius: 22, overflow: 'hidden', backgroundColor: fixed.previewBlank }}>
        {KittedCameraView ? (
          permission === 'granted' ? (
            <KittedCameraView ref={cam} style={StyleSheet.absoluteFill} facing="back" kind="scan" torch={torch} onGuide={(e) => onGuide(e.nativeEvent)} />
          ) : null
        ) : (
          <SimFlatLay width={pw} height={ph} state={simState} />
        )}
        {frozen ? <Image source={{ uri: frozen }} style={StyleSheet.absoluteFill} contentFit="cover" transition={0} /> : null}
        {pieces.map((piece, i) => (
          <Brackets key={i} piece={piece} />
        ))}
      </View>

      {/* Top bar */}
      <View style={[styles.topBar, { top: insets.top + 3 }]}>
        <IconButton icon="close" variant="glass" diameter={44} label={t('cam.a11y.close')} onPress={() => router.back()} />
        {/* The pill goes while a panel shows (the panel says what's wrong). */}
        {stage.kind === 'issue' || stage.kind === 'batch' || stage.kind === 'saved' ? (
          <View style={styles.tipSpacer} />
        ) : (
          <View style={styles.tip} accessibilityLiveRegion="polite">
            {tipView.icon ? <Icon name={tipView.icon} size="small" color={tipView.icon === 'checkFilled' ? fixed.good : fixed.indigo} /> : null}
            <KText variant="subheadline" weight="600" color={fixed.indigo} style={{ flexShrink: 1 }} numberOfLines={isAccessibilitySize ? 0 : 2}>
              {tipView.text}
            </KText>
          </View>
        )}
        {flashUi.toggle ? (
          <IconButton icon={torch ? 'flash' : 'flashOff'} variant="glass" diameter={44} label={t(torch ? 'scan.a11y.torchOn' : 'scan.a11y.torchOff')} onPress={() => setTorch(!torch)} />
        ) : (
          <View style={styles.slot} />
        )}
      </View>

      {flashUi.offer ? (
        <View style={[styles.offerWrap, { top: insets.top + 3 + 52 }]}>
          <Pressable onPress={() => setTorch(true)} accessibilityRole="button" style={({ pressed }) => [styles.offer, { opacity: pressed ? opacity.pressed : 1 }]}>
            <Icon name="flash" size="small" color={fixed.white} />
            <KText variant="subheadline" weight="600" color={fixed.white}>
              {t('cam.flashOffer')}
            </KText>
          </Pressable>
        </View>
      ) : null}

      {/* The standing hint, then the controls */}
      <View style={[styles.bottom, { top: top + ph + 14, bottom: insets.bottom + 8 }]}>
        <KText variant="footnote" weight="600" color={fixed.textSoft} style={{ textAlign: 'center', paddingHorizontal: space.xxl }}>
          {t('scan.hint')}
        </KText>
        <View style={styles.controls}>
          <IconButton icon="photo" variant="glass" diameter={52} label={t('cam.a11y.library')} onPress={() => void pickFromLibrary()} />
          <Pressable onPress={() => void capture()} accessibilityRole="button" accessibilityLabel={t('scan.a11y.shutter')} style={({ pressed }) => [styles.shutter, { opacity: pressed ? opacity.pressed : 1 }]}>
            <View style={styles.shutterDisc} />
          </Pressable>
          <View style={{ width: 52 }} />
        </View>
      </View>

      {stage.kind === 'issue' ? (
        <RetakePanel
          title={issueTitle(stage.issue, 'scan')}
          body={t('scan.retake.body')}
          primary={
            stage.source === 'library'
              ? { title: t('cam.retake.chooseAnother'), icon: 'photo', onPress: () => { backToLive(); void pickFromLibrary(); } }
              : stage.issue.reason === 'dark' && !torch
                ? { title: t('cam.retake.withFlash'), icon: 'flash', onPress: () => { setTorch(true); backToLive(); } }
                : { title: t('cam.retake.retake'), onPress: backToLive }
          }
          secondary={stage.issue.allowUse ? { title: t('cam.retake.useAnyway'), onPress: () => (stage.uri ? void save([stage.uri], stage.source) : void saveDemoScan(store, Date.now()).then(() => setStage({ kind: 'saved', count: 1 }))) } : undefined}
        />
      ) : stage.kind === 'batch' ? (
        <BatchPanel items={stage.items} onSave={(uris) => void save(uris, 'library')} onChooseOthers={() => { backToLive(); void pickFromLibrary(); }} />
      ) : stage.kind === 'notSaved' ? (
        <RetakePanel
          title={stage.many ? t('scan.notSaved.titleMany') : t('scan.notSaved.title')}
          body={t('scan.notSaved.body')}
          primary={
            stage.source === 'library'
              ? { title: t('cam.retake.chooseAnother'), icon: 'photo', onPress: () => { backToLive(); void pickFromLibrary(); } }
              : { title: t('cam.retake.retake'), onPress: backToLive }
          }
          secondary={{ title: t('scan.done'), onPress: () => router.back() }}
        />
      ) : stage.kind === 'saved' ? (
        <RetakePanel
          tone="done"
          title={stage.count === 1 ? t('scan.saved.title') : t('scan.saved.titleMany', { n: stage.count })}
          body={stage.count === 1 ? t('scan.saved.body') : t('scan.saved.bodyMany')}
          primary={{ title: t('scan.another'), icon: 'camera', onPress: () => { busy.current = false; setStage({ kind: 'live' }); } }}
          secondary={{ title: t('scan.done'), onPress: () => router.back() }}
        />
      ) : null}
    </View>
  );
}

/** Corner brackets around a piece; copper when it runs off the edge. */
function Brackets({ piece }: { piece: ScanPiece }) {
  const c = piece.edge ? fixed.copper : fixed.white;
  const arm = Math.max(10, Math.min(22, Math.min(piece.box.width, piece.box.height) * 0.22));
  const b = { position: 'absolute' as const, width: arm, height: arm, borderColor: c };
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: piece.box.x, top: piece.box.y, width: piece.box.width, height: piece.box.height }}>
      <View style={[b, { left: 0, top: 0, borderLeftWidth: 3, borderTopWidth: 3, borderTopLeftRadius: 6 }]} />
      <View style={[b, { right: 0, top: 0, borderRightWidth: 3, borderTopWidth: 3, borderTopRightRadius: 6 }]} />
      <View style={[b, { left: 0, bottom: 0, borderLeftWidth: 3, borderBottomWidth: 3, borderBottomLeftRadius: 6 }]} />
      <View style={[b, { right: 0, bottom: 0, borderRightWidth: 3, borderBottomWidth: 3, borderBottomRightRadius: 6 }]} />
    </View>
  );
}

/** Several library photos, some with problems: which ones, and what to save. */
function BatchPanel({ items, onSave, onChooseOthers }: { items: { uri: string; issue: Issue | null }[]; onSave: (uris: string[]) => void; onChooseOthers: () => void }) {
  const bad = items.filter((i) => i.issue);
  const good = items.filter((i) => !i.issue).map((i) => i.uri);
  const usable = items.filter((i) => !i.issue || i.issue.allowUse).map((i) => i.uri);
  const m = items.length;
  const saveGood = { title: good.length === 1 ? t('scan.review.saveGood1') : t('scan.review.saveGood', { n: good.length }), onPress: () => onSave(good) };
  const saveAll = { title: t('scan.review.saveAll', { n: usable.length }), onPress: () => onSave(usable) };
  const others = { title: t('scan.review.chooseOthers'), icon: 'photo' as const, onPress: onChooseOthers };
  const primary = good.length > 0 ? saveGood : usable.length > 0 ? saveAll : others;
  const secondary = good.length > 0 && usable.length > good.length ? saveAll : undefined;
  return (
    <RetakePanel
      title={bad.length === 1 ? t('scan.review.title1', { m }) : t('scan.review.title', { n: bad.length, m })}
      primary={primary}
      secondary={secondary}
      tertiary={primary === others ? undefined : others}
    >
      <View style={{ gap: 8 }}>
        {bad.slice(0, 4).map((i) => (
          <View key={i.uri} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Image source={{ uri: i.uri }} style={{ width: 40, height: 40, borderRadius: 8 }} contentFit="cover" />
            <KText variant="footnote" color={fixed.textSoft} style={{ flex: 1 }} numberOfLines={2}>
              {issueTitle(i.issue!, 'scan')}
            </KText>
          </View>
        ))}
      </View>
    </RetakePanel>
  );
}

/** Camera permission off: he can still choose photos (S18's wording). */
function ScanCameraOff({ onPick }: { onPick: () => void }) {
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: fixed.black },
  /** The right slot kept while the torch toggle steps aside, so the tip pill doesn't move. */
  slot: { width: 44, height: 44 },
  topBar: { position: 'absolute', left: 18, right: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  tip: {
    flexShrink: 1, minHeight: size.button, borderRadius: size.button / 2, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: fixed.lightPill,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  tipSpacer: { flex: 1 },
  offerWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 2 },
  offer: {
    flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: size.button, paddingHorizontal: 14, borderRadius: size.button / 2, backgroundColor: fixed.offerPill,
    borderWidth: 1, borderColor: fixed.offerPillBorder,
  },
  bottom: { position: 'absolute', left: 0, right: 0, alignItems: 'center', justifyContent: 'space-between' },
  controls: { alignSelf: 'stretch', paddingHorizontal: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  shutter: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: fixed.white, alignItems: 'center', justifyContent: 'center' },
  shutterDisc: { width: 64, height: 64, borderRadius: 32, backgroundColor: fixed.white },
});

// S12 · Share (02 D20, DECISIONS-LOG #347–348): a dark full-screen cover with the card's preview, the three versions
// ("Transparent" | "Solid" | "With photo"), Light | Dark for the solid card, his face choice for the photo version ("Neck down", the default every time, or
// "Full photo"), and Share / Save. The card is drawn once more at full size, off screen, for the capture, so the image
// is exactly what the preview shows and never depends on the screen's size or text size. The transparent preview sits
// on a checkerboard so it reads as see-through; the PNG itself has no background.
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Linking, ScrollView, StyleSheet, View, useColorScheme, useWindowDimensions } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FixedDark, IconButton, KButton, KText, fixed, useTheme } from '@/design-system';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import { GonePage } from '@/features/gone/Gone';
import { Segmented } from '@/features/onboarding/Segmented';
import { t } from '@/i18n/en';
import { ShareCard, type SolidTone } from './ShareCard';
import type { ExportResult } from './exportCard';
import { shareNativeReady } from './shareNative';
import { READY_WAIT_MS, createGate } from './readyGate';
import { FORMAT_SIZE, buildShare, imagesToLoad, photoFor, shareA11y, type FaceChoice, type ShareFormat, type ShareModel } from './shareModel';

const TOP_BAR = 56;
/** The controls' height before they've been measured (the version switch, a toggle, the note, the buttons, the status
 *  line at the default text size); after the first layout the measured height is used, at any text size. */
const CONTROLS_GUESS = 210;
/** The preview never shrinks below this; past it the screen scrolls (the largest text sizes). */
const MIN_PREVIEW_H = 240;

async function loadShare(checkId: string): Promise<ShareModel | null> {
  const row = await store.fitChecks.get(checkId);
  if (!row) return null;
  const parent = row.parentId ? await store.fitChecks.get(row.parentId) : null;
  const chat = await store.chat.all();
  const m = chat.find((c) => c.fitCheckId === row.id && c.kind === 'photo' && c.payload.snap !== true);
  return buildShare(row, parent ?? null, typeof m?.payload.aspect === 'number' ? m.payload.aspect : undefined);
}

export function ShareScreen() {
  const { checkId } = useLocalSearchParams<{ checkId: string }>();
  const m = useLive(['fitChecks', 'chat'], () => loadShare(checkId), [checkId]);
  if (m === undefined) return <View style={{ flex: 1, backgroundColor: fixed.night }} />;
  if (m === null) {
    return (
      <GonePage>
        <KButton title={t('common.close')} size="regular" style={{ alignSelf: 'center' }} onPress={() => router.back()} />
      </GonePage>
    );
  }
  return (
    <FixedDark>
      <ShareBody m={m} />
    </FixedDark>
  );
}

function ShareBody({ m }: { m: ShareModel }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { isAccessibilitySize: ax, archivoLoaded } = useTheme();
  const [format, setFormat] = useState<ShareFormat>('photo');
  // The solid card starts in the phone's own appearance (this screen is always dark, so ask the system, not the theme).
  const system = useColorScheme();
  const [tone, setTone] = useState<SolidTone>(system === 'light' ? 'light' : 'dark');
  // His choice is for this share only: every open starts neck down (founder, Oct 18).
  const [face, setFace] = useState<FaceChoice>('neck');
  const [busy, setBusy] = useState<'share' | 'save' | null>(null);
  const [status, setStatus] = useState<{ line: string; settings: boolean } | null>(null);
  const capture = useRef<View>(null);
  // One press at a time: state updates arrive a frame late, so a fast second tap is caught here (A3).
  const running = useRef(false);
  // Closing the screen mid-share: no state is set on a screen that's gone (the file is still released, exportCard).
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // The captured copy remounts (key) whenever what it draws changes, and gets a new ready gate: it opens once the
  // copy's images have loaded, and never before the Archivo font is in (A1–A2).
  const copyKey = `${format}|${face}|${tone}|${archivoLoaded ? 'a' : '-'}`;
  const gate = useMemo(() => createGate(archivoLoaded ? imagesToLoad(m, format, face) : Infinity), [m, format, face, archivoLoaded]);

  const size = FORMAT_SIZE[format];
  const availW = width - 48;
  // The preview gets the room the controls leave (measured, so it holds at every text size and with Open Settings shown);
  // when that's less than MIN_PREVIEW_H the screen scrolls instead of sliding the card under the title.
  const [controlsH, setControlsH] = useState(CONTROLS_GUESS);
  const availH = Math.max(MIN_PREVIEW_H, height - insets.top - insets.bottom - TOP_BAR - controlsH - 16);
  const scale = Math.min(availW / size.w, availH / size.h, 1);
  const photoCard = format === 'photo';
  const sticker = format === 'sticker';
  const hasPhoto = !!m.photo;
  const neckMissing = face === 'neck' && hasPhoto && !photoFor(m.photo, 'neck');
  const note = sticker ? t('share.sticker.note') : !photoCard ? null : neckMissing ? t('share.face.noNeck') : face === 'full' ? t('share.face.note') : null;
  const locked = busy !== null;

  const say = (r: ExportResult) => {
    if (!alive.current) return;
    const line = r === 'saved' ? t('share.saved') : r === 'denied' ? t('share.saveDenied') : r === 'failed' ? t('share.failed') : null;
    setStatus(line ? { line, settings: r === 'denied' } : null);
    if (line) AccessibilityInfo.announceForAccessibility?.(line);
  };
  const run = async (what: 'share' | 'save') => {
    if (running.current) return;
    running.current = true;
    setBusy(what);
    setStatus(null);
    try {
      if (!shareNativeReady()) return say('failed');
      // Wait for the copy's images and font; past the wait, say so rather than save a card with a blank photo.
      if (!(await gate.wait(READY_WAIT_MS))) return say('failed');
      if (!alive.current) return;
      // Loaded only on a build that has the native modules (shareNative.ts).
      const ex = await import('./exportCard');
      say(await (what === 'share' ? ex.shareCard(capture, format) : ex.saveCard(capture, format)));
    } finally {
      running.current = false;
      if (alive.current) setBusy(null);
    }
  };
  const pick = <T,>(set: (v: T) => void) => (v: T) => {
    if (locked) return;
    set(v);
    setStatus(null);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ flexGrow: 1 }} bounces={false} showsVerticalScrollIndicator={false}>
      <StatusBar style="light" />
      {/* The full-size card the capture reads (off screen, never seen or read by VoiceOver). */}
      <View style={styles.offscreen} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View ref={capture} collapsable={false} style={{ width: size.w, height: size.h }}>
          <ShareCard key={copyKey} m={m} format={format} face={face} tone={tone} onImageLoad={gate.loaded} />
        </View>
      </View>

      <View style={[styles.top, { paddingTop: insets.top, height: insets.top + TOP_BAR }]}>
        <View style={{ position: 'absolute', left: 16, top: insets.top + 6 }}>
          <IconButton icon="close" label={t('common.close')} variant="glass" onPress={() => router.back()} />
        </View>
        <KText variant="headline" color={fixed.white} accessibilityRole="header">{t('share.title')}</KText>
      </View>

      <View style={styles.previewWrap}>
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={shareA11y(m, format)}
          style={[styles.preview, !sticker && !photoCard && styles.solidPreview, { width: size.w * scale, height: (sticker ? size.h + 80 : size.h) * scale }]}
        >
          {sticker ? <Checker width={size.w * scale} height={(size.h + 80) * scale} /> : null}
          <View style={{ width: size.w, height: size.h, marginTop: sticker ? 40 * scale : 0, transform: [{ scale }], transformOrigin: 'top left' }}>
            <ShareCard m={m} format={format} face={face} tone={tone} />
          </View>
        </View>
      </View>

      <View style={[styles.controls, { paddingBottom: insets.bottom + 12 }]} onLayout={(e) => setControlsH(Math.ceil(e.nativeEvent.layout.height))}>
        {/* Locked while a capture or the share sheet is open (A3): the copy must stay what the preview shows. */}
        <View style={{ paddingHorizontal: 24, gap: 10, opacity: locked ? 0.5 : 1 }} pointerEvents={locked ? 'none' : 'auto'} accessibilityState={{ disabled: locked }}>
          <Segmented
            label={t('share.a11y.versions')}
            options={[{ value: 'sticker', label: t('share.v.sticker') }, { value: 'solid', label: t('share.v.solid') }, { value: 'photo', label: t('share.v.photo') }]}
            value={format}
            onChange={pick(setFormat)}
          />
          {format === 'solid' ? (
            <Segmented
              label={t('share.a11y.tone')}
              options={[{ value: 'light', label: t('share.tone.light') }, { value: 'dark', label: t('share.tone.dark') }]}
              value={tone}
              onChange={pick(setTone)}
            />
          ) : null}
          {photoCard && hasPhoto ? (
            <Segmented
              label={t('share.a11y.faces')}
              options={[{ value: 'neck', label: t('share.face.neck') }, { value: 'full', label: t('share.face.full') }]}
              value={face}
              onChange={pick(setFace)}
            />
          ) : null}
          {note ? <KText variant="footnote" color={fixed.textDim} style={{ textAlign: 'center' }}>{note}</KText> : null}
        </View>
        <View style={[styles.buttons, ax && { flexDirection: 'column' }]}>
          <KButton title={t('share.share')} icon="share" size="large" style={ax ? undefined : { flex: 1 }} loading={busy === 'share'} disabled={locked && busy !== 'share'} accessibilityLabel={t('share.a11y.share')} onPress={() => void run('share')} />
          <KButton title={t('share.save')} icon="save" kind="secondary" size="large" style={ax ? undefined : { flex: 1 }} loading={busy === 'save'} disabled={locked && busy !== 'save'} accessibilityLabel={t('share.a11y.save')} onPress={() => void run('save')} />
        </View>
        {/* The status line's room is kept even when it's empty, so "Saved to Photos." doesn't move the preview. */}
        <KText variant="footnote" color={fixed.textSoft} style={{ textAlign: 'center', minHeight: 18 }} accessibilityElementsHidden={!status}>{status?.line ?? ' '}</KText>
        {/* Photos access turned off: the way back is Settings (A5). */}
        {status?.settings ? (
          <KButton title={t('share.openSettings')} kind="secondary" size="regular" style={{ alignSelf: 'center' }} onPress={() => void Linking.openSettings()} />
        ) : null}
      </View>
    </ScrollView>
  );
}

/** A checkerboard behind the transparent preview (the usual sign for "no background"). */
function Checker({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        <Pattern id="checker" width={20} height={20} patternUnits="userSpaceOnUse">
          <Rect width={20} height={20} fill="#2C2F37" />
          <Rect width={10} height={10} fill="#3A3D46" />
          <Rect x={10} y={10} width={10} height={10} fill="#3A3D46" />
        </Pattern>
      </Defs>
      <Rect width={width} height={height} fill="url(#checker)" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: fixed.night },
  offscreen: { position: 'absolute', left: -10000, top: 0 },
  top: { alignItems: 'center', justifyContent: 'center' },
  previewWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 8 },
  // The solid card draws its own rounded indigo ground; its preview keeps that radius (no frame of its own).
  solidPreview: { borderRadius: 24 },
  preview: { borderRadius: 18, borderCurve: 'continuous', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 20, shadowOffset: { width: 0, height: 20 } },
  controls: { gap: 12, paddingTop: 8 },
  buttons: { flexDirection: 'row', gap: 12, paddingHorizontal: 24 },
});

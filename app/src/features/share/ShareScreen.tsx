// S12 · Share (02 D20, DECISIONS-LOG #341): a dark full-screen cover with the card's preview, the cards this check can
// make (Story · TikTok · Before → after · Beat my 8.0), his face choice for this share ("Neck down", the default every
// time, or "Full photo"), and Share / Save. The card is drawn once more at full size, off screen, for the capture,
// so the image is exactly what the preview shows and never depends on the screen's size or text size.
import { useRef, useState } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chip, FixedDark, IconButton, KButton, KText, fixed, useTheme } from '@/design-system';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import { GonePage } from '@/features/gone/Gone';
import { Segmented } from '@/features/onboarding/Segmented';
import { t } from '@/i18n/en';
import { ShareCard } from './ShareCard';
import type { ExportResult } from './exportCard';
import { shareNativeReady } from './shareNative';
import { FORMAT_SIZE, buildShare, photoFor, shareA11y, type FaceChoice, type ShareFormat, type ShareModel } from './shareModel';

const TOP_BAR = 56;
const CONTROLS = 196; // format chips + face toggle + its note + the buttons and their status line

async function loadShare(checkId: string): Promise<ShareModel | null> {
  const row = await store.fitChecks.get(checkId);
  if (!row) return null;
  const parent = row.parentId ? await store.fitChecks.get(row.parentId) : null;
  const [closet, chat] = await Promise.all([store.closet.all(), store.chat.all()]);
  const aspectOf = (id: string | undefined) => {
    const m = id ? chat.find((c) => c.fitCheckId === id && c.kind === 'photo' && c.payload.snap !== true) : undefined;
    return typeof m?.payload.aspect === 'number' ? m.payload.aspect : undefined;
  };
  return buildShare(row, parent ?? null, closet, { row: aspectOf(row.id), parent: aspectOf(parent?.id) });
}

export function ShareScreen() {
  const { checkId } = useLocalSearchParams<{ checkId: string }>();
  const m = useLive(['fitChecks', 'closet', 'chat'], () => loadShare(checkId), [checkId]);
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
  const { isAccessibilitySize: ax } = useTheme();
  // A re-check win opens on its before → after; anything else on the Story card.
  const [format, setFormat] = useState<ShareFormat>(m.formats.includes('beforeAfter') ? 'beforeAfter' : m.formats[0]!);
  // His choice is for this share only: every open starts neck down (founder, Oct 18).
  const [face, setFace] = useState<FaceChoice>('neck');
  const [busy, setBusy] = useState<'share' | 'save' | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const capture = useRef<View>(null);

  const size = FORMAT_SIZE[format];
  const availW = width - 48;
  const availH = Math.max(200, height - insets.top - insets.bottom - TOP_BAR - CONTROLS);
  const scale = Math.min(availW / size.w, availH / size.h, 1);
  const hasPhoto = !!m.photo || !!m.before?.photo;
  const neckMissing = face === 'neck' && hasPhoto && !photoFor(m.photo, 'neck');
  const note = neckMissing ? t('share.face.noNeck') : face === 'full' ? t('share.face.note') : null;

  const say = (r: ExportResult) => {
    const line = r === 'saved' ? t('share.saved') : r === 'denied' ? t('share.saveDenied') : r === 'failed' ? t('share.failed') : null;
    setStatus(line);
    if (line) AccessibilityInfo.announceForAccessibility?.(line);
  };
  const run = async (what: 'share' | 'save') => {
    if (busy) return;
    setBusy(what);
    setStatus(null);
    try {
      if (!shareNativeReady()) return say('failed');
      // Loaded only on a build that has the native modules (shareNative.ts).
      const ex = await import('./exportCard');
      say(await (what === 'share' ? ex.shareCard(capture, format) : ex.saveCard(capture, format)));
    } finally {
      setBusy(null);
    }
  };
  const label = (f: ShareFormat) => (f === 'beat' ? t('share.fmt.beat', { score: m.scoreText }) : t(`share.fmt.${f}`));

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      {/* The full-size card the capture reads (off screen, never seen or read by VoiceOver). */}
      <View style={styles.offscreen} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View ref={capture} collapsable={false} style={{ width: size.w, height: size.h }}>
          <ShareCard m={m} format={format} face={face} />
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
          style={[styles.preview, { width: size.w * scale, height: size.h * scale }]}
        >
          <View style={{ width: size.w, height: size.h, transform: [{ scale }], transformOrigin: 'top left' }}>
            <ShareCard m={m} format={format} face={face} />
          </View>
        </View>
      </View>

      <View style={[styles.controls, { paddingBottom: insets.bottom + 12 }]}>
        {m.formats.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} accessibilityLabel={t('share.a11y.formats')}>
            {m.formats.map((f) => (
              <Chip key={f} title={label(f)} small state={f === format ? 'selected' : 'normal'} onPress={() => { setFormat(f); setStatus(null); }} />
            ))}
          </ScrollView>
        ) : null}
        {hasPhoto ? (
          <View style={{ paddingHorizontal: 24, gap: 6 }}>
            <Segmented
              label={t('share.a11y.faces')}
              options={[{ value: 'neck', label: t('share.face.neck') }, { value: 'full', label: t('share.face.full') }]}
              value={face}
              onChange={(v) => { setFace(v); setStatus(null); }}
            />
            {note ? <KText variant="footnote" color={fixed.textDim} style={{ textAlign: 'center' }}>{note}</KText> : null}
          </View>
        ) : null}
        <View style={[styles.buttons, ax && { flexDirection: 'column' }]}>
          <KButton title={t('share.share')} icon="share" size="large" style={ax ? undefined : { flex: 1 }} loading={busy === 'share'} accessibilityLabel={t('share.a11y.share')} onPress={() => void run('share')} />
          <KButton title={t('share.save')} icon="save" kind="secondary" size="large" style={ax ? undefined : { flex: 1 }} loading={busy === 'save'} accessibilityLabel={t('share.a11y.save')} onPress={() => void run('save')} />
        </View>
        {status ? <KText variant="footnote" color={fixed.textSoft} style={{ textAlign: 'center' }}>{status}</KText> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: fixed.night },
  offscreen: { position: 'absolute', left: -10000, top: 0 },
  top: { alignItems: 'center', justifyContent: 'center' },
  previewWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  preview: { borderRadius: 18, borderCurve: 'continuous', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 20, shadowOffset: { width: 0, height: 20 } },
  controls: { gap: 12, paddingTop: 8 },
  chips: { gap: 8, paddingHorizontal: 24 },
  buttons: { flexDirection: 'row', gap: 12, paddingHorizontal: 24 },
});

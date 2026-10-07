// S13 Photo viewer (02 S13): a black full-screen cover with the neck-down photo (the only copy
// kept), pinch and double-tap zoom, pull down to close, an X top-left and "{Occasion} · {date}".
// A check finished with a shoe snap pages between the photo and the snap (page dots).
// Built on iOS ScrollView zooming and bounce, so it needs no gesture-handler root (#35).
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton, KText, NeckDownPhoto, fixed, neckDownAspect } from '@/design-system';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import { demoPhoto, type DemoPhoto } from '@/demo/demoPhotos';
import { occasionLabel } from '@/features/stylist/thread';
import { t } from '@/i18n/en';
import { longDate } from '@/i18n/format';
import { sessionClock } from '@/state/session';

const PULL_TO_CLOSE = 90;
const DOUBLE_TAP_MS = 280;
const ZOOM = 2.5;

export function PhotoViewer() {
  const { checkId } = useLocalSearchParams<{ checkId: string }>();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const data = useLive(['fitChecks', 'chat'], async () => {
    const row = await store.fitChecks.get(checkId);
    if (!row) return null;
    const msgs = (await store.chat.all()).filter((m) => m.fitCheckId === checkId && m.kind === 'photo');
    const snapId = msgs.find((m) => m.payload.snap === true)?.payload.photoId;
    const photos = [demoPhoto(row.demoPhotoId), typeof snapId === 'string' ? demoPhoto(snapId) : undefined].filter((p): p is DemoPhoto => !!p);
    return { photos, caption: t('viewer.caption', { occasion: occasionLabel(row.occasion), date: longDate(row.createdAt, sessionClock.offset) }), date: longDate(row.createdAt, sessionClock.offset) };
  }, [checkId]);

  const close = () => router.back();
  const onPage = (e: NativeSyntheticEvent<NativeScrollEvent>) => setPage(Math.round(e.nativeEvent.contentOffset.x / width));
  const photos = data?.photos ?? [];

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} scrollEnabled={photos.length > 1} onMomentumScrollEnd={onPage}>
        {photos.map((p, i) => (
          <ZoomPage
            key={p.id}
            photo={p}
            width={width}
            height={height}
            insets={{ top: insets.top + 56, bottom: insets.bottom + 48 }}
            label={photos.length > 1 ? `${t('a11y.photo', { time: data!.date })} ${t('viewer.a11y.page', { n: i + 1, total: photos.length })}` : t('a11y.photo', { time: data!.date })}
            onClose={close}
          />
        ))}
      </ScrollView>
      <View style={[styles.top, { top: insets.top + 8 }]}>
        <IconButton icon="close" label={t('common.close')} variant="glass" onPress={close} />
      </View>
      <View style={[styles.bottom, { bottom: insets.bottom + 12 }]} pointerEvents="none">
        {photos.length > 1 ? (
          <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {photos.map((p, i) => (
              <View key={p.id} style={[styles.dot, { opacity: i === page ? 1 : 0.35 }]} />
            ))}
          </View>
        ) : null}
        {data ? (
          <KText variant="footnote" color={fixed.white} style={{ opacity: 0.75 }}>
            {data.caption}
          </KText>
        ) : null}
      </View>
    </View>
  );
}

/** One photo: fits the screen between the X and the caption; pinch or double-tap to zoom; pull down to close. */
function ZoomPage({ photo, width, height, insets, label, onClose }: {
  photo: DemoPhoto; width: number; height: number; insets: { top: number; bottom: number }; label: string; onClose: () => void;
}) {
  const scroll = useRef<ScrollView>(null);
  const zoomed = useRef(false);
  const lastTap = useRef(0);
  const regionAspect = neckDownAspect(photo.crop, photo.aspect);
  const maxH = height - insets.top - insets.bottom;
  const w = Math.min(width, maxH * regionAspect);
  const h = w / regionAspect;

  const onTap = () => {
    const now = Date.now();
    if (now - lastTap.current < DOUBLE_TAP_MS) {
      const s = scroll.current as unknown as { scrollResponderZoomTo?: (r: { x: number; y: number; width: number; height: number; animated: boolean }) => void } | null;
      s?.scrollResponderZoomTo?.(
        zoomed.current
          ? { x: 0, y: 0, width, height, animated: true }
          : { x: (width - width / ZOOM) / 2, y: (height - height / ZOOM) / 2, width: width / ZOOM, height: height / ZOOM, animated: true },
      );
      zoomed.current = !zoomed.current;
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  };
  const onEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, zoomScale } = e.nativeEvent;
    zoomed.current = (zoomScale ?? 1) > 1.01;
    if (!zoomed.current && contentOffset.y < -PULL_TO_CLOSE) onClose();
  };

  return (
    <ScrollView
      ref={scroll}
      style={{ width, height }}
      contentContainerStyle={{ width, height, alignItems: 'center', justifyContent: 'center' }}
      maximumZoomScale={4}
      minimumZoomScale={1}
      bouncesZoom
      alwaysBounceVertical
      centerContent
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      onScrollEndDrag={onEndDrag}
      contentInsetAdjustmentBehavior="never"
    >
      <Pressable onPress={onTap} accessible={false}>
        <NeckDownPhoto source={photo.source} aspect={photo.aspect} crop={photo.crop} width={w} height={h} accessibilityLabel={label} />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: fixed.black },
  top: { position: 'absolute', left: 16 },
  bottom: { position: 'absolute', left: 16, right: 16, alignItems: 'center', gap: 10 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: fixed.white },
});

// S23 · "Which one is you?" (02 S23, Oct 14): a photo with two people of comparable size. His photo with a tap target
// over each person (a light outline; copper when tapped) and Cancel. Tapping himself starts the check with everyone
// else covered in what's sent; Cancel ends it with nothing sent or counted. Built from existing parts only.
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { fixed, KCard, KCardSection, KText, NeckDownPhoto, neckDownAspect, opacity, radius, Seam, size, space, useTheme } from '@/design-system';
import type { ChatMessage } from '@/data/types';
import { cancelWhichOne, pickPerson } from '@/features/camera/startCheck';
import { demoPhoto } from '@/demo/demoPhotos';
import { leftToRight, whichOneOf } from '@/features/fitcheck/whichOne';
import { t } from '@/i18n/en';

/** The photo's height on the card at most (a tall photo is narrower instead). */
const MAX_PHOTO_H = 400;
/** How long the copper outline shows before the check starts, so the tap reads. */
const OUTLINE_MS = 220;

/** `readOnly`: Past chats (09 §22.7 F11): an earlier day's open question isn't pickable, so it doesn't show (nothing was
 *  sent or counted for it). */
export function WhichOneCard({ m, readOnly = false }: { m: ChatMessage; readOnly?: boolean }) {
  const q = whichOneOf(m);
  const { a11y } = useTheme();
  const [width, setWidth] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const open = q?.state === 'open' && !readOnly;

  useEffect(() => {
    if (open) AccessibilityInfo.announceForAccessibility?.(t('whichOne.q'));
  }, [open]);

  if (!q || !open) return null;
  // His photo as he took it (the whole frame: the targets sit on it). Demo screens: a bundled photo, neck-down like
  // every bundled photo (its boxes are drawn on that frame).
  const demo = q.photoId ? demoPhoto(q.photoId) : undefined;
  const aspect = demo ? neckDownAspect(demo.crop, demo.aspect) : q.aspect && q.aspect > 0 ? q.aspect : 3 / 4;
  const h = width > 0 ? Math.min(width / aspect, MAX_PHOTO_H) : 0;
  const w = h * aspect;
  // VoiceOver names each person by where they stand; the targets are drawn biggest first, so a smaller one is on top.
  const rank = new Map(leftToRight(q.people).map(([i], n) => [i, n + 1]));

  const pick = (i: number) => {
    if (busy) return;
    setBusy(true);
    setChosen(i);
    if (Platform.OS === 'ios') void Haptics.selectionAsync();
    setTimeout(() => {
      void pickPerson(m.id, i).then((r) => {
        // Still waiting (another photo is reading, or the tap didn't land): he can tap again.
        if (!r || r.outcome === 'busy') {
          setBusy(false);
          setChosen(null);
        }
      });
    }, a11y.reduceMotion ? 0 : OUTLINE_MS);
  };
  const cancel = () => {
    if (busy) return;
    setBusy(true);
    void cancelWhichOne(m.id);
  };

  return (
    <Animated.View entering={a11y.reduceMotion ? undefined : FadeIn.duration(180)}>
      <KCard>
        <KCardSection>
          <View style={styles.qText}>
            <KText variant="headline" accessibilityRole="header">
              {t('whichOne.q')}
            </KText>
            <KText variant="subheadline" color="ink2">
              {t('whichOne.hint')}
            </KText>
          </View>
          <View style={styles.photoRow} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
            {h > 0 ? (
              <View style={[styles.photo, { width: w, height: h }]}>
                {demo ? (
                  <NeckDownPhoto source={demo.source} aspect={demo.aspect} crop={demo.crop} width={w} height={h} />
                ) : (
                  <Image source={{ uri: q.photoUri }} style={StyleSheet.absoluteFill} contentFit="cover" accessible={false} />
                )}
                {q.people.map((b, i) => {
                  const on = chosen === i;
                  // Each target is the person's box, at least the 44 pt hit area, inside the photo.
                  const bw = b.width * w, bh = b.height * h;
                  const tw = Math.min(w, Math.max(bw, size.hit)), th = Math.min(h, Math.max(bh, size.hit));
                  const left = Math.max(0, Math.min(w - tw, b.x * w - (tw - bw) / 2));
                  const top = Math.max(0, Math.min(h - th, b.y * h - (th - bh) / 2));
                  return (
                    <Pressable
                      key={i}
                      onPress={() => pick(i)}
                      disabled={busy}
                      accessibilityRole="button"
                      accessibilityLabel={t('whichOne.a11y.person', { n: rank.get(i) ?? i + 1, count: q.people.length })}
                      accessibilityHint={t('whichOne.a11y.personHint')}
                      accessibilityState={{ disabled: busy, selected: on }}
                      style={({ pressed }) => [
                        styles.target,
                        { left, top, width: tw, height: th },
                        on || pressed ? styles.targetOn : null,
                      ]}
                    />
                  );
                })}
              </View>
            ) : null}
          </View>
        </KCardSection>
        <Seam />
        <Pressable
          onPress={cancel}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={t('common.cancel')}
          accessibilityHint={t('whichOne.a11y.cancelHint')}
          accessibilityState={{ disabled: busy }}
          style={({ pressed }) => [styles.cancel, { opacity: pressed ? opacity.pressed : busy ? opacity.disabled : 1 }]}
        >
          <KText role="textLink" color="ink2">
            {t('common.cancel')}
          </KText>
        </Pressable>
      </KCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  qText: { gap: 4 },
  photoRow: { alignItems: 'center' },
  photo: { borderRadius: radius.thumb, overflow: 'hidden' },
  target: { position: 'absolute', borderRadius: radius.thumb, borderWidth: 1.5, borderColor: fixed.lightPill },
  targetOn: { borderWidth: 3, borderColor: fixed.copper },
  cancel: { minHeight: size.hit, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.cardPadH, paddingVertical: 10 },
});

// Chat pieces — StylistMessage (`.say`, `.who`), UserBubble (`.me`), PhotoBubble (`.me.photo`),
// DayStamp (`.stamp`), and NeckDownPhoto (03 §8 display rules). 03 §5 "Chat", 02 §4.
// Copy rule: always "Your stylist", never "AI stylist". All strings come from @/i18n/en.

import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image, type ImageSource } from 'expo-image';
import { t } from '@/i18n/en';
import { useTheme } from '../theme';
import { fixed, radius, size } from '../tokens';
import { wordmark, wordmarkStyle } from '../typography';
import { Icon } from './Icon';
import { KText } from './KText';

// ---------------------------------------------------------------------------------------
// StylistMessage: no bubble; body ink text up to 92% wide. On the first message of a run, a
// header: an 18 pt avatar square (radius 5, fixed.label, "K" in Archivo Expanded at 10.5,
// fixed.onDark) + "Your stylist" (footnote semibold ink3), then 4 pt.

export interface StylistMessageProps {
  children: string;
  showHeader?: boolean;
  /** Extra content under the text (cards, chips). Not part of the spoken text. */
  footer?: ReactNode;
}

export function StylistMessage({ children, showHeader, footer }: StylistMessageProps) {
  const { archivoLoaded } = useTheme();
  return (
    <View style={{ maxWidth: '92%', alignSelf: 'flex-start', gap: 4 }}>
      <View accessible accessibilityLabel={t('a11y.stylistSays', { who: t('common.who'), text: children })} style={{ gap: 4 }}>
        {showHeader ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                width: size.avatar,
                height: size.avatar,
                borderRadius: radius.avatar,
                borderCurve: 'continuous',
                backgroundColor: fixed.label,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text allowFontScaling={false} style={[wordmarkStyle(wordmark.avatar.fontSize, 0, archivoLoaded), { color: fixed.onDark }]}>
                K
              </Text>
            </View>
            <KText role="stylistWho">{t('common.who')}</KText>
          </View>
        ) : null}
        <KText role="chatText">{children}</KText>
      </View>
      {footer}
    </View>
  );
}

// ---------------------------------------------------------------------------------------
// UserBubble: me fill, body onMe text, padding 10 / 16, corners 24 with the bottom-trailing
// tail at 6, trailing-aligned, max 78% wide. Onboarding answers are tappable to change.

export function UserBubble({ children, onPress }: { children: string; onPress?: () => void }) {
  const { colors } = useTheme();
  const bubble = (
    <View
      style={{
        backgroundColor: colors.me,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderTopLeftRadius: radius.bubble,
        borderTopRightRadius: radius.bubble,
        borderBottomLeftRadius: radius.bubble,
        borderBottomRightRadius: radius.bubbleTail,
        borderCurve: 'continuous',
      }}
    >
      <KText role="userBubbleText">{children}</KText>
    </View>
  );
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={children}
        accessibilityHint={t('a11y.changeAnswer')}
        style={{ alignSelf: 'flex-end', maxWidth: '78%' }}
      >
        {bubble}
      </Pressable>
    );
  }
  return <View style={{ alignSelf: 'flex-end', maxWidth: '78%' }}>{bubble}</View>;
}

// ---------------------------------------------------------------------------------------
// NeckDownPhoto: fills a fixed frame with the neck-down part of a photo, top-aligned at the
// chin line (03 §8). Stored check photos are ALREADY neck-down (pass no crop). The demo's
// bundled photos pass the mockup's PH fractions ({ neck, foot, cx }) plus the image aspect.
// RN's Image has no object-position, so we size and offset the image inside a clipped view.

export interface PhotoCrop {
  /** Chin line, fraction of the image height (0 = top). */
  neck: number;
  /** Just below the feet, fraction of the image height. */
  foot: number;
  /** Body center, fraction of the image width. */
  cx: number;
}

/** Anything expo-image takes: a require() module, a URI string or an ImageSource. */
export type PhotoSource = number | string | ImageSource;

export interface NeckDownPhotoProps {
  source: PhotoSource;
  /** Image width / height (needed only with `crop`). */
  aspect?: number;
  crop?: PhotoCrop;
  width: number;
  height: number;
  borderRadii?: { tl: number; tr: number; br: number; bl: number };
  /** "Your outfit photo, Oct 22". Never describe the body. */
  accessibilityLabel?: string;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
/** The mockup pads the feet by 1.2% of the image height (placePhoto, mode "neck"). */
const FOOT_PAD = 0.012;

/** width / height of a photo's neck-down region (the full image width over the neck→feet span). */
export function neckDownAspect(crop: PhotoCrop, aspect: number): number {
  return aspect / Math.max(0.05, crop.foot + FOOT_PAD - crop.neck);
}

/**
 * Where to put the image inside a W×H frame so neck→feet fills the height, centered on the
 * body, never exposing an image edge (mockup `placePhoto`, mode "neck"; 03 §8).
 */
export function neckDownLayout(crop: PhotoCrop, aspect: number, width: number, height: number) {
  const span = Math.max(0.05, crop.foot + FOOT_PAD - crop.neck);
  let h = height / span;
  let w = h * aspect;
  if (w < width) {
    w = width;
    h = width / aspect;
  }
  return {
    width: w,
    height: h,
    left: clamp(width / 2 - crop.cx * w, width - w, 0),
    top: clamp(-crop.neck * h, height - h, 0),
  };
}

export function NeckDownPhoto({ source, aspect, crop, width, height, borderRadii, accessibilityLabel }: NeckDownPhotoProps) {
  const { colors } = useTheme();
  const frame = {
    width,
    height,
    overflow: 'hidden' as const,
    backgroundColor: colors.surface2,
    borderCurve: 'continuous' as const,
    ...(borderRadii
      ? {
          borderTopLeftRadius: borderRadii.tl,
          borderTopRightRadius: borderRadii.tr,
          borderBottomRightRadius: borderRadii.br,
          borderBottomLeftRadius: borderRadii.bl,
        }
      : null),
  };
  const a11y = accessibilityLabel
    ? { accessible: true, accessibilityRole: 'image' as const, accessibilityLabel }
    : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const };

  if (!crop || !aspect) {
    // Stored check photos are already neck-down: cover, top-aligned.
    return (
      <View style={frame} {...a11y}>
        <Image source={source} contentFit="cover" contentPosition="top center" transition={0} style={{ width, height }} />
      </View>
    );
  }
  const box = neckDownLayout(crop, aspect, width, height);
  return (
    <View style={frame} {...a11y}>
      <Image source={source} contentFit="fill" transition={0} style={{ position: 'absolute', ...box }} />
    </View>
  );
}

// ---------------------------------------------------------------------------------------
// PhotoBubble: 135 pt wide me frame, 4 pt padding, outer radius 21 (tail 6). The photo is
// 172 pt tall, radius 17 (tail 4), neck-down. Caption row: footnote onMe @ 90%, occasion left
// and time right ("Date · 7:42"). While reading (ruling 13): lock + "Only this is sent".

export interface PhotoBubbleProps {
  source: PhotoSource;
  aspect?: number;
  crop?: PhotoCrop;
  occasion?: string;
  /** "7:42" */
  time: string;
  /** True while the check is reading: the caption shows lock + "Only this is sent" (ruling 13). */
  reading?: boolean;
  /** Opens the photo viewer (S13). */
  onPress?: () => void;
}

export function PhotoBubble({ source, aspect, crop, occasion, time, reading, onPress }: PhotoBubbleProps) {
  const { colors } = useTheme();
  const innerW = size.photoBubbleWidth - 8;
  const spoken =
    (occasion ? t('a11y.photoOccasion', { time, occasion }) : t('a11y.photo', { time })) +
    (reading ? ` ${t('read.bubble.onlySent')}.` : '');
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessible
      accessibilityRole={onPress ? 'imagebutton' : 'image'}
      accessibilityLabel={spoken}
      accessibilityHint={onPress ? t('a11y.photoHint') : undefined}
      style={{
        alignSelf: 'flex-end',
        width: size.photoBubbleWidth,
        padding: 4,
        backgroundColor: colors.me,
        borderTopLeftRadius: radius.photoBubble,
        borderTopRightRadius: radius.photoBubble,
        borderBottomLeftRadius: radius.photoBubble,
        borderBottomRightRadius: radius.bubbleTail,
        borderCurve: 'continuous',
      }}
    >
      <NeckDownPhoto
        source={source}
        aspect={aspect}
        crop={crop}
        width={innerW}
        height={size.photoBubbleHeight}
        borderRadii={{ tl: radius.photoBubbleInner, tr: radius.photoBubbleInner, br: radius.photoBubbleInnerTail, bl: radius.photoBubbleInner }}
      />
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: reading ? 'flex-start' : 'center',
          paddingTop: 6,
          paddingBottom: 5,
          paddingHorizontal: 9,
          opacity: 0.9,
          gap: 4,
        }}
      >
        {reading ? (
          // 109 pt can't hold lock + "Only this is sent" + the time on one line: the label wraps.
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 4, flexShrink: 1 }}>
            <Icon name="lock" size="small" color={colors.onMe} />
            <KText role="photoCaption" numberOfLines={2} style={{ flexShrink: 1 }}>
              {t('read.bubble.onlySent')}
            </KText>
          </View>
        ) : (
          <KText role="photoCaption" numberOfLines={1} style={{ flexShrink: 1 }}>
            {occasion ?? ''}
          </KText>
        )}
        <KText role="photoCaption" tabular numberOfLines={1} style={{ flexShrink: 0 }}>
          {time}
        </KText>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------------------
// DayStamp: centered footnote medium ink3 ("Thursday 8:00 am").

export function DayStamp({ children }: { children: string }) {
  return (
    <View style={{ alignSelf: 'center' }}>
      <KText role="dayStamp" style={{ textAlign: 'center' }}>
        {children}
      </KText>
    </View>
  );
}


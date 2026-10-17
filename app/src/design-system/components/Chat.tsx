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
import { userBubbleMaxWidth } from './chatLayout';
import { Icon } from './Icon';
import { KText } from './KText';

// ---------------------------------------------------------------------------------------
// StylistMessage, look C "stylist note" (founder, Oct 16, #302; mockups/chat-answers.html): a 28 pt column on the
// leading side holding the K mark (radius 8, fixed.label, Archivo Expanded 14, fixed.onDark) on the first line of a
// run, then a 10 pt gap and the text. Later lines of the same run keep the column empty, so the text lines up; the
// footer (cards, chips, buttons) sits in the text column too. `body` replaces the plain text (an answer's lead and
// chips, features/ask/AnswerBody); `children` is always the whole text, for VoiceOver.

export interface StylistMessageProps {
  children: string;
  showHeader?: boolean;
  /** Drawn in the text's place (an answer's lead, reason and piece chips). */
  body?: ReactNode;
  /** Extra content under the text (cards, chips). Not part of the spoken text. */
  footer?: ReactNode;
  /** VoiceOver actions on the text (an answer's piece chips: "Open dark jeans"). */
  actions?: readonly { name: string; label: string; onPress: () => void }[];
}

export function StylistMark() {
  const { archivoLoaded, scheme } = useTheme();
  return (
    <View
      style={{
        width: size.mark,
        height: size.mark,
        borderRadius: radius.mark,
        borderCurve: 'continuous',
        backgroundColor: fixed.label,
        // On night backgrounds the indigo mark sinks in; a faint rim keeps its edge (#302).
        ...(scheme === 'dark' ? { borderWidth: 1, borderColor: fixed.labelRimDark } : null),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text allowFontScaling={false} style={[wordmarkStyle(wordmark.mark.fontSize, 0, archivoLoaded), { color: fixed.onDark }]}>
        K
      </Text>
    </View>
  );
}

export function StylistMessage({ children, showHeader, body, footer, actions }: StylistMessageProps) {
  // At the accessibility text sizes the mark goes above the text, so the words get the full width (rows stack there).
  const { isAccessibilitySize } = useTheme();
  const stacked = isAccessibilitySize;
  return (
    <View style={{ flexDirection: stacked ? 'column' : 'row', gap: stacked ? 6 : size.markGap, marginTop: showHeader ? 4 : 0 }}>
      {!stacked || showHeader ? (
        <View style={{ width: size.mark }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          {showHeader ? <StylistMark /> : null}
        </View>
      ) : null}
      <View style={stacked ? { gap: 4 } : { flex: 1, minWidth: 0, gap: 4 }}>
        <View
          accessible
          accessibilityLabel={t('a11y.stylistSays', { who: t('common.who'), text: children })}
          accessibilityActions={actions?.map((a) => ({ name: a.name, label: a.label }))}
          onAccessibilityAction={actions ? (e) => actions.find((a) => a.name === e.nativeEvent.actionName)?.onPress() : undefined}
          style={{ gap: 4, paddingTop: showHeader && !stacked ? 3 : 0 }}
        >
          {body ?? <KText role="chatText">{children}</KText>}
        </View>
        {footer}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------------------
// UserBubble: me fill, body onMe text, padding 10 / 16, corners 24 with the bottom-trailing
// tail at 6, trailing-aligned, max 78% wide. Onboarding answers are tappable to change.

export function UserBubble({ children, onPress }: { children: string; onPress?: () => void }) {
  const { colors, isAccessibilitySize } = useTheme();
  const maxWidth = userBubbleMaxWidth(isAccessibilitySize);
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
        style={{ alignSelf: 'flex-end', maxWidth }}
      >
        {bubble}
      </Pressable>
    );
  }
  return <View style={{ alignSelf: 'flex-end', maxWidth }}>{bubble}</View>;
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
// and time right ("Date · 7:42"). While reading (ruling 13): lock + "Face hidden when sent".

export interface PhotoBubbleProps {
  source: PhotoSource;
  aspect?: number;
  crop?: PhotoCrop;
  occasion?: string;
  /** "7:42" */
  time: string;
  /** True while the check is reading: the caption shows lock + "Face hidden when sent" (ruling 13). */
  reading?: boolean;
  /** Opens the photo viewer (S13). */
  onPress?: () => void;
}

export function PhotoBubble({ source, aspect, crop, occasion, time, reading, onPress }: PhotoBubbleProps) {
  const { colors, isAccessibilitySize } = useTheme();
  // At the accessibility sizes the 109 pt caption row inside the frame cut the occasion and "Face hidden when sent" to
  // "…" (or broke "Every-day"): the caption goes under the bubble, full width, and wraps (07 §17, U13).
  const below = isAccessibilitySize;
  const innerW = size.photoBubbleWidth - 8;
  const spoken =
    (occasion ? t('a11y.photoOccasion', { time, occasion }) : t('a11y.photo', { time })) +
    (reading ? ` ${t('read.bubble.onlySent')}.` : '');
  const bubble = (
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
      {below ? null : (
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
            // 109 pt can't hold lock + "Face hidden when sent" + the time on one line: the label wraps.
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
      )}
    </Pressable>
  );
  if (!below) return bubble;
  const caption = reading ? t('read.bubble.onlySent') : occasion ? `${occasion} · ${time}` : time;
  return (
    <View style={{ alignSelf: 'flex-end', alignItems: 'flex-end', gap: 4, maxWidth: '88%' }}>
      {bubble}
      {/* The bubble's label already says all of it. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {reading ? <Icon name="lock" size="small" color="ink2" /> : null}
        <KText role="dayStamp" color="ink2" style={{ textAlign: 'right', flexShrink: 1 }}>
          {caption}
        </KText>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------------------
// DayStamp: centered footnote medium ink3 ("Thursday 8:00 am").

export function DayStamp({ children }: { children: string }) {
  // A header, so the VoiceOver rotor can jump from day to time (07 §17, U18).
  return (
    <View style={{ alignSelf: 'center' }} accessible accessibilityRole="header">
      <KText role="dayStamp" style={{ textAlign: 'center' }}>
        {children}
      </KText>
    </View>
  );
}


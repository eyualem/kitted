// S12 · the share card (02 D20, DECISIONS-LOG #343–344): one overlay, after Strava's share stickers, in three versions.
// Drawn at a fixed size in pt (360 wide) and captured at 3× (1080 px), so nothing here follows Dynamic Type: it's an
// image. The overlay: white stats (a small label over a big Archivo value), the tape (5 to 10 in halves; a copper dot
// on the score, a hollow one on the "before" of a re-check win), then the KITTED wordmark. Copper is the dot only.
// "Transparent": the overlay alone on no background. "Solid": the same, on the indigo ground. "With photo": the same overlay on his photo, with a soft shade
// at the bottom so the white reads on a bright photo, sitting just above Instagram's bottom 20%.
import { Image } from 'expo-image';
import { Text, View, type TextStyle } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Rect, Stop } from 'react-native-svg';
import { FixedDark, NeckDownPhoto, fixed, numeralStyle, useTheme, wordmarkStyle } from '@/design-system';
import { FORMAT_SIZE, PHOTO_OVERLAY_BOTTOM, photoFor, type FaceChoice, type ShareFormat, type ShareModel, type SharePhoto } from './shareModel';

const SHADOW: TextStyle = { textShadowColor: 'rgba(0, 0, 0, 0.35)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 };

/** The solid card's corner radius (pt). */
const SOLID_RADIUS = 24;

const TAPE_W = 200;
const tapeX = (s: number) => ((s - 5) / 5) * TAPE_W;

/** The tape: 5 to 10 in halves; whole numbers tall (8 pt), halves short (4 pt); the dot on the score. */
function Tape({ score, before }: { score: number; before: number | null }) {
  const ticks = Array.from({ length: 11 }, (_, i) => 5 + i / 2);
  return (
    <Svg width={TAPE_W + 12} height={26} viewBox={`-6 0 ${TAPE_W + 12} 26`}>
      {ticks.map((s, i) => {
        const major = i % 2 === 0;
        return <Line key={s} x1={tapeX(s)} x2={tapeX(s)} y1={18 - (major ? 8 : 4)} y2={18} stroke={fixed.white} strokeOpacity={major ? 0.75 : 0.4} strokeWidth={1.25} />;
      })}
      <Line x1={0} x2={TAPE_W} y1={18} y2={18} stroke={fixed.white} strokeOpacity={0.9} strokeWidth={1.5} />
      {before !== null ? <Circle cx={tapeX(before)} cy={18} r={4.5} fill="none" stroke={fixed.white} strokeWidth={1.5} /> : null}
      <Circle cx={tapeX(score)} cy={18} r={5} fill={fixed.copper} />
    </Svg>
  );
}

/** The overlay itself: the stats, the tape, the wordmark. `shadow` on a photo. */
function Overlay({ m, shadow }: { m: ShareModel; shadow: boolean }) {
  const { archivoLoaded } = useTheme();
  const s = shadow ? SHADOW : null;
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', gap: m.stats.length > 2 ? 30 : 34 }}>
        {m.stats.map((st) => (
          <View key={st.label} style={{ alignItems: 'center', gap: 4 }}>
            <Text allowFontScaling={false} style={[{ fontSize: 13, fontWeight: '500', color: fixed.white, opacity: 0.85, letterSpacing: 0.26 }, s]}>{st.label}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text allowFontScaling={false} numberOfLines={1} style={[numeralStyle(40, 'score', archivoLoaded), { color: fixed.white, letterSpacing: -0.2, lineHeight: 42 }, s]}>{st.value}</Text>
              {st.unit ? (
                <Text allowFontScaling={false} style={[numeralStyle(15, 'score', archivoLoaded), { color: fixed.white, opacity: 0.8, marginLeft: 2, letterSpacing: 0 }, s]}>{st.unit}</Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>
      <View style={{ marginTop: 14, marginBottom: 14 }}>
        <Tape score={m.score} before={m.before?.score ?? null} />
      </View>
      <Text allowFontScaling={false} style={[wordmarkStyle(11, 0.26, archivoLoaded), { color: fixed.white, opacity: 0.9, marginRight: -11 * 0.26 }, s]}>KITTED</Text>
    </View>
  );
}

/** His photo for this face choice, filling the card: neck down by its crop; "Full photo" head to feet, fitted by
 *  height (a frame wider than the photo is filled with a blurred copy of it). */
function Photo({ photo, face }: { photo: SharePhoto | null; face: FaceChoice }) {
  const { w, h } = FORMAT_SIZE.photo;
  const shown = photoFor(photo, face);
  if (!shown) return null;
  if (shown.crop) return <NeckDownPhoto source={shown.source} aspect={shown.aspect} crop={shown.crop} width={w} height={h} />;
  const a = shown.aspect;
  const fitW = a ? h * a : w;
  if (!a || fitW >= w) return <Image source={shown.source} contentFit="cover" contentPosition="top center" transition={0} style={{ width: w, height: h }} />;
  return (
    <View style={{ width: w, height: h }}>
      <Image source={shown.source} contentFit="cover" blurRadius={24} transition={0} style={{ position: 'absolute', width: w, height: h, opacity: 0.55 }} />
      <Image source={shown.source} contentFit="fill" transition={0} style={{ position: 'absolute', left: (w - fitW) / 2, top: 0, width: fitW, height: h }} />
    </View>
  );
}

/** The shade under the overlay on the photo card: clear to 45%, night at 35% by 65%, 65% at the bottom. Drawn in SVG
 *  so it's the same on iOS, the web preview and the captured image. */
function Shade({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0 }}>
      <Defs>
        <LinearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0.45" stopColor={fixed.night} stopOpacity={0} />
          <Stop offset="0.65" stopColor={fixed.night} stopOpacity={0.35} />
          <Stop offset="1" stopColor={fixed.night} stopOpacity={0.65} />
        </LinearGradient>
      </Defs>
      <Rect width={width} height={height} fill="url(#shade)" />
    </Svg>
  );
}

/** One version at its drawn size. The sticker has no background at all (the PNG keeps its transparency). */
export function ShareCard({ m, format, face }: { m: ShareModel; format: ShareFormat; face: FaceChoice }) {
  const { w, h } = FORMAT_SIZE[format];
  if (format === 'solid') {
    // The indigo ground with rounded corners (outside them the PNG stays transparent, so it sits like a sticker).
    return (
      <FixedDark>
        <View style={{ width: w, height: h, alignItems: 'center', justifyContent: 'center', backgroundColor: fixed.indigo, borderRadius: SOLID_RADIUS, borderCurve: 'continuous', overflow: 'hidden' }}>
          <Overlay m={m} shadow={false} />
        </View>
      </FixedDark>
    );
  }
  if (format === 'sticker') {
    return (
      <FixedDark>
        <View style={{ width: w, height: h, alignItems: 'center', justifyContent: 'center' }}>
          <Overlay m={m} shadow={false} />
        </View>
      </FixedDark>
    );
  }
  return (
    <FixedDark>
      <View style={{ width: w, height: h, backgroundColor: fixed.night, overflow: 'hidden' }}>
        <Photo photo={m.photo} face={face} />
        <Shade width={w} height={h} />
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: PHOTO_OVERLAY_BOTTOM }}>
          <Overlay m={m} shadow />
        </View>
      </View>
    </FixedDark>
  );
}

// S12 · the share cards themselves (02 D20, DECISIONS-LOG #341; the demos: mockups/share-cards/ a1, a3, c2). Drawn at
// a fixed size in pt (360 wide) and captured at 3× (1080 px), so nothing here follows Dynamic Type: it's an image.
// Always the fixed-dark palette. The rules every card keeps (#341): no drawn text under 11 pt (mono labels 10), one
// score lockup (Archivo numeral, "/10", the word, "Reads as …"), one sign-off (the woven label, then
// "Score your fit · trykitted.com"), copper only on the seam and the score's movement, text inside its platform's
// safe zone (shareModel SAFE), text over a photo on ≥ 80% indigo.
import { Image } from 'expo-image';
import { Text, View, type TextStyle } from 'react-native';
import { FixedDark, NeckDownPhoto, Numeral, WovenLabel, fixed } from '@/design-system';
import { PieceArt } from '@/features/closet/GarmentArt';
import { t } from '@/i18n/en';
import { FORMAT_SIZE, SAFE, photoFor, type FaceChoice, type ShareFormat, type ShareModel, type SharePhoto, type SharePiece } from './shareModel';

const W = 360;
const H = 640;
const PAD = 20;
const INDIGO_90 = 'rgba(18, 22, 40, 0.90)';
const DIM = 'rgba(255, 255, 255, 0.75)';
/** The "before" score beside the after: white @ 55%, as the re-check card's struck "was". */
const BEFORE_NUM = 'rgba(255, 255, 255, 0.55)';

const txt = (size: number, weight: TextStyle['fontWeight'], color: string = fixed.white, extra?: TextStyle): TextStyle => ({
  fontSize: size, fontWeight: weight, color, letterSpacing: size >= 20 ? -0.2 : 0, ...extra,
});

/** A fixed text: never scales (the card is an image). */
function T({ style, children, lines = 1 }: { style: TextStyle; children: string; lines?: number }) {
  return <Text allowFontScaling={false} numberOfLines={lines} style={style}>{children}</Text>;
}

/** The copper stitch: 1.5 pt dashes, 5 on / 4 off, sized for a known length (no layout pass before the capture). */
function Stitch({ length, vertical = false, color = fixed.copper }: { length: number; vertical?: boolean; color?: string }) {
  const n = Math.max(0, Math.floor((length + 4) / 9));
  return (
    <View style={{ flexDirection: vertical ? 'column' : 'row', gap: 4, width: vertical ? 1.5 : length, height: vertical ? length : 1.5, overflow: 'hidden' }}>
      {Array.from({ length: n }, (_, i) => (
        <View key={i} style={vertical ? { width: 1.5, height: 5, backgroundColor: color } : { width: 5, height: 1.5, backgroundColor: color }} />
      ))}
    </View>
  );
}

/** The sign-off, the same on every card: the woven label, then the line. */
function SignOff() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <WovenLabel size="small" />
      <T style={txt(12, '600', 'rgba(255, 255, 255, 0.85)')}>{t('share.signoff')}</T>
    </View>
  );
}

/** The score lockup: numeral, "/10", the word and "Reads as …". */
function Lockup({ m, size = 72 }: { m: ShareModel; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3 }}>
        <Numeral size={size} fixedSize color={fixed.white}>{m.scoreText}</Numeral>
        <T style={txt(11, '500', DIM, { fontFamily: 'Menlo', marginBottom: 4 })}>/10</T>
      </View>
      <View style={{ paddingBottom: 3, gap: 2, flexShrink: 1 }}>
        <T style={txt(20, '700')}>{m.word}</T>
        {m.readsAs ? <T style={txt(13, '400', DIM)}>{m.readsAs}</T> : null}
      </View>
    </View>
  );
}

function Flats({ pieces, size = 32, gap = 6 }: { pieces: SharePiece[]; size?: number; gap?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap }}>
      {pieces.map((p) => (
        <View key={p.id} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          <PieceArt item={p.item} size={size} />
        </View>
      ))}
    </View>
  );
}

/** The photo for this face choice, or the pieces drawn large when there's no photo to show neck down. */
function PhotoArea({ photo, face, pieces, width, height }: { photo: SharePhoto | null; face: FaceChoice; pieces: SharePiece[]; width: number; height: number }) {
  const shown = photoFor(photo, face);
  if (shown) {
    if (shown.crop) return <NeckDownPhoto source={shown.source} aspect={shown.aspect} crop={shown.crop} width={width} height={height} />;
    return (
      <View style={{ width, height, overflow: 'hidden', backgroundColor: fixed.panel }}>
        <Image source={shown.source} contentFit="cover" contentPosition="top center" transition={0} style={{ width, height }} />
      </View>
    );
  }
  return <PiecesArea pieces={pieces} width={width} height={height} />;
}

/** No photo on this card: the pieces, drawn, two by two, with their names. */
function PiecesArea({ pieces, width, height }: { pieces: SharePiece[]; width: number; height: number }) {
  const art = Math.min(118, Math.floor((Math.min(width, height) - 72) / 2));
  return (
    <View style={{ width, height, backgroundColor: '#1A2448', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: art * 2 + 24, gap: 24, justifyContent: 'center' }}>
        {pieces.map((p) => (
          <View key={p.id} style={{ width: art, alignItems: 'center', gap: 6 }}>
            <View style={{ width: art, height: art, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' }}>
              <PieceArt item={p.item} size={Math.round(art * 0.78)} />
            </View>
            <T style={txt(12, '500', 'rgba(255,255,255,0.85)')}>{p.name}</T>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Instagram Stories (9 : 16): the photo over the indigo band, every word between 14% and 80% of the height. */
function StoryCard({ m, face }: { m: ShareModel; face: FaceChoice }) {
  const photoH = 400;
  return (
    <View style={{ width: W, height: H, backgroundColor: fixed.indigo }}>
      <PhotoArea photo={m.photo} face={face} pieces={m.pieces} width={W} height={photoH} />
      <Stitch length={W} />
      <View style={{ paddingHorizontal: PAD, paddingTop: 12, gap: 14 }}>
        <SignOff />
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <Lockup m={m} />
          {photoFor(m.photo, face) ? <Flats pieces={m.pieces.slice(0, 3)} size={30} gap={4} /> : null}
        </View>
      </View>
    </View>
  );
}

/** TikTok photo mode (9 : 16): the photo full bleed; the words on a 90% indigo panel inside TikTok's safe zone. */
function TikTokCard({ m, face }: { m: ShareModel; face: FaceChoice }) {
  const safe = SAFE.tiktok;
  const right = Math.round(W * safe.right);
  const bottom = Math.round(H * (1 - safe.bottom));
  const hasPhoto = !!photoFor(m.photo, face);
  return (
    <View style={{ width: W, height: H, backgroundColor: fixed.indigo }}>
      <PhotoArea photo={m.photo} face={face} pieces={m.pieces} width={W} height={hasPhoto ? H : Math.round(H * 0.5)} />
      <View style={{ position: 'absolute', left: 16, right: right, top: bottom - 158, height: 158, borderRadius: 16, backgroundColor: INDIGO_90, padding: 14, gap: 10, borderCurve: 'continuous' }}>
        <SignOff />
        <Lockup m={m} size={64} />
        {hasPhoto ? <Flats pieces={m.pieces} size={28} gap={6} /> : null}
      </View>
    </View>
  );
}

/** The re-check win (9 : 16, Instagram Stories' zones): both photos, then before → after with the fix he made. */
function BeforeAfterCard({ m, face }: { m: ShareModel; face: FaceChoice }) {
  const b = m.before!;
  const photoH = 372;
  const half = W / 2;
  const tag = (label: string, score: string) => (
    <View style={{ position: 'absolute', left: 12, bottom: 12, flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: fixed.photoTag, borderRadius: 7, paddingHorizontal: 9, paddingVertical: 5 }}>
      <T style={txt(11, '600', 'rgba(255,255,255,0.85)', { letterSpacing: 1.2 })}>{label.toUpperCase()}</T>
      <T style={txt(13, '700')}>{score}</T>
    </View>
  );
  return (
    <View style={{ width: W, height: H, backgroundColor: fixed.indigo }}>
      <View style={{ flexDirection: 'row', height: photoH }}>
        <View style={{ width: half, height: photoH }}>
          <PhotoArea photo={b.photo} face={face} pieces={[]} width={half} height={photoH} />
          {tag(t('share.ba.before'), b.scoreText)}
        </View>
        <View style={{ position: 'absolute', left: half - 0.75, top: 0, zIndex: 2 }}>
          <Stitch length={photoH} vertical />
        </View>
        <View style={{ width: half, height: photoH }}>
          <PhotoArea photo={m.photo} face={face} pieces={m.pieces} width={half} height={photoH} />
          {tag(t('share.ba.after'), m.scoreText)}
        </View>
      </View>
      <Stitch length={W} />
      <View style={{ paddingHorizontal: PAD, paddingTop: 12, gap: 12 }}>
        <SignOff />
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
          <Numeral size={40} fixedSize color={BEFORE_NUM} style={{ marginBottom: 6 }}>{b.scoreText}</Numeral>
          <T style={txt(24, '700', fixed.copper, { marginBottom: 12 })}>→</T>
          <Numeral size={72} fixedSize color={fixed.white}>{m.scoreText}</Numeral>
          <View style={{ paddingBottom: 3, gap: 2 }}>
            <T style={txt(20, '700')}>{m.word}</T>
            <T style={txt(15, '600', fixed.copper)}>{b.delta}</T>
          </View>
        </View>
        {b.fix ? <T style={txt(15, '600')} lines={2}>{t('share.ba.fix', { fix: b.fix })}</T> : null}
      </View>
    </View>
  );
}

/** "Beat my 8.0" (4 : 5, for a DM): his fit and the score to beat. */
function BeatCard({ m, face }: { m: ShareModel; face: FaceChoice }) {
  const { w, h } = FORMAT_SIZE.beat;
  const photoH = 262;
  return (
    <View style={{ width: w, height: h, backgroundColor: fixed.indigo }}>
      <PhotoArea photo={m.photo} face={face} pieces={m.pieces} width={w} height={photoH} />
      <Stitch length={w} />
      <View style={{ paddingHorizontal: PAD, paddingTop: 14, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
          <T style={txt(30, '800', fixed.white, { marginBottom: 8, letterSpacing: -0.4 })}>{t('share.beat.title', { score: '' }).trim()}</T>
          <Numeral size={64} fixedSize color={fixed.white}>{m.scoreText}</Numeral>
          <T style={txt(18, '700', fixed.white, { marginBottom: 8 })}>{m.word}</T>
        </View>
        <T style={txt(14, '400', DIM)}>{t('share.beat.sub')}</T>
        <SignOff />
      </View>
    </View>
  );
}

/** One card at its drawn size, inside the fixed-dark palette. */
export function ShareCard({ m, format, face }: { m: ShareModel; format: ShareFormat; face: FaceChoice }) {
  return (
    <FixedDark>
      {format === 'story' ? <StoryCard m={m} face={face} />
        : format === 'tiktok' ? <TikTokCard m={m} face={face} />
          : format === 'beforeAfter' && m.before ? <BeforeAfterCard m={m} face={face} />
            : <BeatCard m={m} face={face} />}
    </FixedDark>
  );
}

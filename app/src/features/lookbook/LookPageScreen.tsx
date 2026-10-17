// L2 · a Lookbook look's page (02 L2; 09-ui-review §6.4; #280), pushed from a Lookbook row. Drawn from the read-only
// model in lookPage.ts:
//   1. The photo, full width, 3 : 4, neck-down; a tap opens the full viewer. No photo: a "Photo deleted" block that
//      opens nothing (the viewer would be empty).
//   2. The card: the tagline and occasion, the score in Archivo with its word (a re-check: 8.0 → 9.0, the word, and the
//      Before photo), the summary, the fixes in the card's words (caught ones done), the tip line.
//   3. Pieces: the look's closet pieces as drawn tiles, each opening its piece page.
//   4. Show in chat.
// Read-only: the score is the stored one; nothing here changes the occasion, re-scores, re-checks or corrects.
// Not built (no dead buttons): Wear this again, the ⋯ menu (Save, Share, Delete photo).
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { Stack, router } from 'expo-router';
import {
  DeltaRow, FixRow, Icon, KButton, KCard, KCardSection, KText, NeckDownPhoto, RowDivider, ScoreBlock, Seam, TagLine, TipLine,
  opacity, radius, space, useTheme,
} from '@/design-system';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import { ClosetTile } from '@/features/closet/ClosetTile';
import { t } from '@/i18n/en';
import { sessionClock } from '@/state/session';
import { loadLook, showInChat, type LookPageModel } from './lookPage';
import { GonePage } from '@/features/gone/Gone';

const PIECE_TILE = 76;
const BEFORE_W = 50;
const BEFORE_H = 63;

export function LookPage({ id }: { id: string }) {
  const { colors } = useTheme();
  const look = useLive(['fitChecks', 'closet', 'chat'], () => loadLook(store, id, { zone: sessionClock.offset }), [id]);
  if (look === undefined) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  if (look === null) return <GonePage />;
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingHorizontal: space.gutter, paddingTop: space.xs, paddingBottom: space.xxxl, gap: space.stack }}
    >
      <Stack.Screen options={{ title: look?.title ?? '' }} />
      {look ? <LookBody look={look} /> : null}
    </ScrollView>
  );
}

function LookBody({ look }: { look: LookPageModel }) {
  return (
    <>
      <Photo look={look} />
      <ScoreCard look={look} />
      {look.pieces.length > 0 ? <Pieces look={look} /> : null}
      {look.chatMessageId ? <KButton title={t('look.showInChat')} kind="secondary" size="large" onPress={() => showInChat(look)} /> : null}
    </>
  );
}

function Photo({ look }: { look: LookPageModel }) {
  const { colors } = useTheme();
  const { width: screenW } = useWindowDimensions();
  const w = Math.max(0, Math.round(screenW - space.gutter * 2));
  if (!look.photo) {
    return (
      <View
        accessible
        accessibilityLabel={t('look.photoDeleted')}
        style={{ height: 96, borderRadius: radius.card, borderCurve: 'continuous', backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', gap: 6 }}
      >
        <Icon name="photo" color="ink3" size="regular" />
        <KText variant="footnote" color="ink3">{t('look.photoDeleted')}</KText>
      </View>
    );
  }
  const p = look.photo;
  const href = look.photoHref;
  return (
    <Pressable
      onPress={look.photoHref ? () => router.push(href as never) : undefined}
      accessibilityRole="button"
      accessibilityLabel={t('a11y.photoOccasion', { time: look.date, occasion: look.occasion })}
      accessibilityHint={t('a11y.photoHint')}
      style={({ pressed }) => ({ opacity: pressed ? opacity.pressed : 1 })}
    >
      <NeckDownPhoto source={p.source} aspect={p.aspect} crop={p.crop} width={w} height={Math.round((w * 4) / 3)}
        borderRadii={{ tl: radius.card, tr: radius.card, br: radius.card, bl: radius.card }}
      />
    </Pressable>
  );
}

function ScoreCard({ look }: { look: LookPageModel }) {
  const { isAccessibilitySize: ax } = useTheme();
  const before = look.before;
  return (
    <KCard>
      <KCardSection>
        <TagLine left={look.tag} right={look.occasion} />
        {before ? (
          <View accessible accessibilityLabel={look.scoreA11y} style={{ gap: 4 }}>
            <DeltaRow was={before.score} now={look.score} />
            <KText variant="headline">{look.word}</KText>
          </View>
        ) : (
          <ScoreBlock score={look.score} verdict={look.partialLabel ? undefined : look.summary ?? undefined} partialLabel={look.partialLabel ?? undefined} partialDone={look.partialDone} />
        )}
        {look.summary && (before || look.partialLabel) ? <KText variant="subheadline" color="ink2">{look.summary}</KText> : null}
        {before?.photo ? (
          <Pressable
            onPress={before.href ? () => router.push(before.href as never) : undefined}
            accessibilityRole="button"
            accessibilityLabel={`${t('look.before')}. ${before.scoreText}.`}
            accessibilityHint={t('a11y.photoHint')}
            style={({ pressed }) => ({ flexDirection: ax ? 'column' : 'row', alignItems: ax ? 'flex-start' : 'center', gap: space.m, alignSelf: 'flex-start', opacity: pressed ? opacity.pressed : 1 })}
          >
            <NeckDownPhoto source={before.photo.source} aspect={before.photo.aspect} crop={before.photo.crop} width={BEFORE_W} height={BEFORE_H}
              borderRadii={{ tl: radius.thumb, tr: radius.thumb, br: radius.thumb, bl: radius.thumb }}
            />
            <KText variant="footnote" color="ink2">{`${t('look.before')} · ${before.scoreText}`}</KText>
          </Pressable>
        ) : null}
      </KCardSection>
      {look.fixes.length > 0 || look.noFixLine || look.tip ? (
        <>
          <Seam />
          <KCardSection paddingVertical={4} gap={0}>
            {look.fixes.map((f, i) => (
              <View key={`${f.title}-${i}`}>
                {i > 0 ? <RowDivider /> : null}
                <FixRow number={f.number} title={f.title} detail={f.detail} gain={f.gain} done={f.done} />
              </View>
            ))}
            {look.noFixLine ? (
              <View style={{ paddingVertical: space.fixRowV }}>
                <KText role="fixTitle">{look.noFixLine}</KText>
              </View>
            ) : null}
            {look.tip ? <TipLine lead={look.tip.lead} text={look.tip.text} first={look.fixes.length === 0 && !look.noFixLine} /> : null}
          </KCardSection>
        </>
      ) : null}
    </KCard>
  );
}

function Pieces({ look }: { look: LookPageModel }) {
  return (
    <View style={{ gap: space.m }}>
      <TagLine left={t('look.pieces')} right={String(look.pieces.length)} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.m }}>
        {look.pieces.map((p) => (
          <ClosetTile key={p.id} item={p.item} size={PIECE_TILE} radius={radius.tile} label={p.name}
            accessibilityHint={t('closet.piece.a11y.tileHint')} onPress={() => router.push(p.href as never)}
          />
        ))}
      </View>
    </View>
  );
}

// L1 · Lookbook (02 D16). Until P5 builds the calendar and look grid, it shows the real list of
// his scored checks (newest first; a re-check folds into its check as "8.0 → 9.0"), or the L1e
// empty state. Tapping a look opens its photo. No dev placeholder text in a tab (DECISIONS-LOG #56).
import { ActionSheetIOS, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { EmptyState, Icon, KButton, KCard, KText, NeckDownPhoto, RowDivider, displayScore, opacity, scoreWordLabel, useTheme } from '@/design-system';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import type { FitCheckRow } from '@/data/types';
import { shownPhoto } from '@/demo/demoPhotos';
import { fitCheck } from '@/features/fitcheck/session';
import { occasionLabel } from '@/features/stylist/thread';
import { showToast } from '@/features/toast/toast';
import { goToStylist } from '@/router/stylistAction';
import { longDate } from '@/i18n/format';
import { t } from '@/i18n/en';
import { sessionClock } from '@/state/session';

interface Look {
  check: FitCheckRow;
  latest: FitCheckRow;
}

export default function LookbookScreen() {
  const { colors } = useTheme();
  const looks = useLive(['fitChecks'], async () => {
    // A look he removed (#118) stays in the chat but not here.
    const all = (await store.fitChecks.all()).filter((c) => c.status === 'scored' && c.score !== null && !c.details.removedFromLookbook);
    const recheckOf = new Map<string, FitCheckRow>();
    for (const c of all) if (c.parentId && (!recheckOf.get(c.parentId) || recheckOf.get(c.parentId)!.createdAt < c.createdAt)) recheckOf.set(c.parentId, c);
    return all
      .filter((c) => !c.parentId)
      .map((c): Look => ({ check: c, latest: recheckOf.get(c.id) ?? c }))
      .sort((a, b) => b.check.createdAt - a.check.createdAt);
  }, []);
  if (!looks) return null;
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 18, gap: 13 }}>
      {looks.length === 0 ? (
        <EmptyState art={<GhostLook />} body={t('lookbook.empty')}>
          <KButton title={t('closet.empty.check')} icon="camera" size="regular" style={{ alignSelf: 'center' }} onPress={() => goToStylist({ kind: 'checkMyFit' })} />
        </EmptyState>
      ) : (
        <KCard>
          {looks.map((l, i) => (
            <View key={l.check.id}>
              {i > 0 ? <RowDivider /> : null}
              <LookRow look={l} />
            </View>
          ))}
        </KCard>
      )}
    </ScrollView>
  );
}

function LookRow({ look: { check, latest } }: { look: Look }) {
  const { colors } = useTheme();
  const photo = shownPhoto(check.demoPhotoId, check.photoFile, undefined);
  const score = latest.score ?? 0;
  const rechecked = latest !== check && check.score !== null;
  const scoreText = rechecked ? `${displayScore(check.score!)} → ${displayScore(score)}` : displayScore(score);
  const title = `${occasionLabel(check.occasion)} · ${longDate(check.createdAt, sessionClock.offset)}`;
  return (
    <Pressable
      onPress={() => router.push(`/photo/${check.id}`)}
      onLongPress={() => void lookMenu(check.id, title)}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${scoreText}, ${scoreWordLabel(score)}.`}
      accessibilityActions={[{ name: 'remove', label: t('lookbook.remove.action') }]}
      onAccessibilityAction={(e) => e.nativeEvent.actionName === 'remove' && void lookMenu(check.id, title)}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 10, paddingHorizontal: 14, opacity: pressed ? opacity.pressed : 1 })}
    >
      {photo ? (
        <NeckDownPhoto source={photo.source} aspect={photo.aspect} crop={photo.crop} width={50} height={63} borderRadii={{ tl: 10, tr: 10, br: 10, bl: 10 }} />
      ) : (
        <View style={{ width: 50, height: 63, borderRadius: 10, borderCurve: 'continuous', backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="photo" color="ink3" size="small" />
        </View>
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <KText variant="subheadline" weight="600" numberOfLines={2}>
          {title}
        </KText>
        <KText variant="footnote" color="ink2">
          {scoreWordLabel(score)}
        </KText>
      </View>
      <KText variant="headline">{scoreText}</KText>
    </Pressable>
  );
}

/**
 * Long-press a look (#118): "Remove from Lookbook", and when the look added pieces no other check has seen (a
 * fitting-room try-on), "Remove look and its new pieces". Its chat card stays; a toast offers Undo.
 */
async function lookMenu(checkId: string, title: string) {
  const extra = (await fitCheck.closet.onlyInLook(checkId)).length;
  const options = [
    t('lookbook.remove.action'),
    ...(extra > 0 ? [extra === 1 ? t('lookbook.remove.withPiece') : t('lookbook.remove.withPieces', { n: extra })] : []),
    t('common.cancel'),
  ];
  ActionSheetIOS.showActionSheetWithOptions(
    { title, message: t('lookbook.remove.note'), options, destructiveButtonIndex: extra > 0 ? [0, 1] : 0, cancelButtonIndex: options.length - 1 },
    (i) => {
      if (i === options.length - 1) return;
      const withPieces = i === 1 && extra > 0;
      void fitCheck.closet.removeLook(checkId, withPieces).then((r) => {
        if (!r) return;
        const n = r.removedItems.length;
        showToast(n === 0 ? t('lookbook.removed') : n === 1 ? t('lookbook.removed1') : t('lookbook.removedN', { n }), () => fitCheck.closet.restoreLook(r));
      });
    },
  );
}

/** L1e: the dashed 3 : 4 ghost of the first look. */
function GhostLook() {
  const { colors } = useTheme();
  return <View style={{ width: 96, height: 128, borderRadius: 20, borderCurve: 'continuous', borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.inkFaint }} />;
}

// L1 · Lookbook (02 D16). Until P5 builds the calendar and look grid, it shows the real list of
// his scored checks (newest first; a re-check folds into its check as "8.0 → 9.0"), or the L1e
// empty state. Tapping a look opens its page (L2, #280). No dev placeholder text in a tab (DECISIONS-LOG #56).
import { Pressable, ScrollView, View } from 'react-native';
import { EmptyState, Icon, KButton, KCard, KText, NeckDownPhoto, Numeral, RowDivider, displayScore, opacity, radius, scoreWordLabel, space, spokenScoreLine, useTheme } from '@/design-system';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import type { FitCheckRow } from '@/data/types';
import { shownPhoto } from '@/demo/demoPhotos';
import { removeLookMenu } from '@/features/lookbook/lookActions';
import { openLookPage } from '@/features/lookbook/lookPage';
import { occasionLabel } from '@/features/stylist/thread';
import { goToStylist } from '@/router/stylistAction';
import { longDate } from '@/i18n/format';
import { t } from '@/i18n/en';
import { sessionClock } from '@/state/session';
import { useTourStop } from '@/features/onboarding/appTour';
import { ExampleLookbook } from '@/features/onboarding/ExampleLookbook';

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
  // The app tour's second stop (specs/app-tour.md AT2): the example lookbook in place of this screen.
  const tourStop = useTourStop();
  if (tourStop === 2) return <ExampleLookbook />;
  if (!looks) return null;
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: space.gutter, gap: space.stack }}>
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
  const { colors, isAccessibilitySize: ax } = useTheme();
  const photo = shownPhoto(check.demoPhotoId, check.photoFile, undefined);
  const score = latest.score ?? 0;
  const rechecked = latest !== check && check.score !== null;
  const scoreText = rechecked ? `${displayScore(check.score!)} → ${displayScore(score)}` : displayScore(score);
  const title = `${occasionLabel(check.occasion)} · ${longDate(check.createdAt, sessionClock.offset)}`;
  return (
    <Pressable
      onPress={() => openLookPage(check.id)}
      onLongPress={() => void lookMenu(check.id, title)}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${spokenScoreLine(score, rechecked ? check.score : undefined)}`}
      accessibilityActions={[{ name: 'remove', label: t('lookbook.remove.action') }]}
      onAccessibilityAction={(e) => e.nativeEvent.actionName === 'remove' && void lookMenu(check.id, title)}
      // AX sizes: photo, title and score stack, so the title isn't squeezed to a word per line.
      style={({ pressed }) => ({ flexDirection: ax ? 'column' : 'row', alignItems: ax ? 'flex-start' : 'center', gap: space.m, paddingVertical: space.rowY, paddingHorizontal: space.rowX, opacity: pressed ? opacity.pressed : 1 })}
    >
      {photo ? (
        <NeckDownPhoto source={photo.source} aspect={photo.aspect} crop={photo.crop} width={50} height={63} borderRadii={{ tl: radius.thumb, tr: radius.thumb, br: radius.thumb, bl: radius.thumb }} />
      ) : (
        <View style={{ width: 50, height: 63, borderRadius: radius.thumb, borderCurve: 'continuous', backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="photo" color="ink3" size="small" />
        </View>
      )}
      <View style={ax ? { gap: 2, alignSelf: 'stretch' } : { flex: 1, gap: 2 }}>
        <KText variant="subheadline" weight="600" numberOfLines={ax ? 0 : 2}>
          {title}
        </KText>
        <KText variant="footnote" color="ink2">
          {scoreWordLabel(score)}
        </KText>
      </View>
      {/* Archivo, like every score (#276). */}
      <Numeral size={20} trimDescender={false}>{scoreText}</Numeral>
    </Pressable>
  );
}

/** Long-press a look (#118): lookActions.ts removeLookMenu (the look page's ⋯ uses it too). */
const lookMenu = (checkId: string, title: string) => removeLookMenu(checkId, title);

/** L1e: the dashed 3 : 4 ghost of the first look. */
function GhostLook() {
  const { colors } = useTheme();
  return <View style={{ width: 96, height: 128, borderRadius: 20, borderCurve: 'continuous', borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.inkFaint }} />;
}

// The tips (specs/setup-and-you.md SY2): a small card in Kit's voice with Got it, at the top of Closet, Lookbook and
// You, and under the first score card. Each reads its own done mark live, so Got it (or Show me around) shows at once.
import { Pressable, View } from 'react-native';
import { KCard, KText, opacity, radius, size, space } from '@/design-system';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import { t, type StringKey } from '@/i18n/en';
import { dismissTip, firstScoreAfter, firstScoreTipCheck, hasScoredCheck, isTipDone, tabTipShows, type TabTip, type TipId } from './tips';

const WORDS: Record<TipId, StringKey> = {
  firstScore: 'tips.firstScore',
  closet: 'tips.closet',
  lookbook: 'tips.lookbook',
  you: 'tips.you',
};

/** The card itself: the words, then Got it at the trailing edge (at least 44 × 44 pt). */
export function TipCard({ id }: { id: TipId }) {
  return (
    <View testID={`tip-${id}`}>
      <KCard radius={radius.cardSmall}>
        <View style={{ paddingHorizontal: space.rowX, paddingTop: space.m, gap: 2 }}>
          <KText variant="subheadline" color="ink">
            {t(WORDS[id])}
          </KText>
          <View style={{ alignItems: 'flex-end' }}>
            {/* Its own Pressable, not TextLink: "Got it" is narrower than 44 pt, and SY2.8 asks for 44 × 44. */}
            <Pressable
              onPress={() => void dismissTip(store, id)}
              accessibilityRole="button"
              accessibilityLabel={t('tips.gotIt')}
              style={({ pressed }) => ({ minHeight: size.hit, minWidth: size.hit, paddingLeft: space.m, alignItems: 'flex-end', justifyContent: 'center', opacity: pressed ? opacity.pressed : 1 })}
            >
              <KText role="textLink" color="ink">
                {t('tips.gotIt')}
              </KText>
            </Pressable>
          </View>
        </View>
      </KCard>
    </View>
  );
}

/** A tab's tip: shown while it isn't done, his first check is scored, and the tab has something in it (SY2.3–SY2.5). */
export function TabTipCard({ id, hasContent = true }: { id: TabTip; hasContent?: boolean }) {
  const state = useLive(['kv', 'fitChecks'], async () => ({ done: await isTipDone(store, id), scored: hasScoredCheck(await store.fitChecks.all()) }), [id]);
  if (!state || !tabTipShows(state.done, state.scored, hasContent)) return null;
  return <TipCard id={id} />;
}

/** Under a score card in the chat: only the first scored check's (or, after Show me around, the next one's), until
 *  Got it or its re-check (SY2.2, SY3.3). */
export function FirstScoreTip({ checkId }: { checkId: string }) {
  const shows = useLive(
    ['kv', 'fitChecks'],
    async () => !(await isTipDone(store, 'firstScore')) && firstScoreTipCheck(await store.fitChecks.all(), await firstScoreAfter(store)) === checkId,
    [checkId],
  );
  if (!shows) return null;
  return (
    <View style={{ marginTop: space.s }}>
      <TipCard id="firstScore" />
    </View>
  );
}

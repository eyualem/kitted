// C5 · Starter essentials (02 C5; 10-onboarding.md §9.3): move 1's destination. "You probably own a few already. Tap the
// ones you have." The 12 essentials for his looks (#313, finish/packs.ts; today's 12 with no picks), with a line naming
// them, and their budget and mid prices; pieces seen in his checks are already ticked
// ("In your closet"); a tap marks one he owns (a not-photographed closet piece), with "+N fits"; untapping one he
// marked removes it, with Undo. The Next step card at the end.
import { Pressable, View } from 'react-native';
import { displayHex } from '@kitted/core';
import { Icon, KCard, KText, MonoLabel, RowDivider, opacity, space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import { PieceArt } from '@/features/closet/GarmentArt';
import { SettingsScroll } from '@/features/settings/SettingsList';
import { showToast } from '@/features/toast/toast';
import { t } from '@/i18n/en';
import { newId } from '@/services/ids';
import { sessionClock } from '@/state/session';
import { getStarterMarks, STARTER_MARKS_KEY } from './service';
import { SlotBar } from './SlotBar';
import { picksLine, starterList } from './packs';
import { NEXT_STEP, ownedCount, ownership, type Ownership, type StarterEntry } from './starter';
import { toggleStarter } from './starterActions';

export function StarterScreen() {
  const closet = useLive(['closet'], () => store.closet.all(), []);
  const marks = useLive(['kv'], () => getStarterMarks(store), [], STARTER_MARKS_KEY);
  const profile = useLive(['profile'], () => store.profile.get('me'), []);
  if (!closet || !marks || profile === undefined) return null;
  const styles = profile?.styles ?? null;
  const list = starterList(styles);
  const line = picksLine(styles);
  const own = ownership(closet, marks);
  const n = ownedCount(own, list.map((e) => e.id));
  const tap = async (e: StarterEntry) => {
    const toast = await toggleStarter(store, e, newId, sessionClock.nowMs());
    if (toast) showToast(toast.text, toast.undo);
  };
  return (
    <SettingsScroll>
      <View style={{ gap: space.m, paddingHorizontal: space.xs }}>
        <KText variant="subheadline" color="ink2">
          {t('starter.sub')}
        </KText>
        {line ? (
          <KText variant="subheadline" color="accent">
            {line}
          </KText>
        ) : null}
        <View accessible accessibilityLabel={t('starter.a11y.count', { n })} style={{ gap: space.s }}>
          <KText variant="headline">{t('closet.essentials.count', { n })}</KText>
          <SlotBar filled={n} slots={12} />
        </View>
      </View>
      <KCard radius={20}>
        {list.map((e, i) => (
          <View key={e.id}>
            {i > 0 ? <RowDivider /> : null}
            <StarterRow entry={e} own={own[e.id] ?? { owned: false }} onPress={() => void tap(e)} />
          </View>
        ))}
      </KCard>
      <KCard radius={20}>
        <View style={{ padding: space.l, gap: space.xs }} accessible accessibilityLabel={`${t('starter.next.tag')}. ${NEXT_STEP.name}. ${t('starter.next.detail')}`}>
          <MonoLabel>{t('starter.next.tag')}</MonoLabel>
          <KText variant="subheadline" weight="600">
            {NEXT_STEP.name}
          </KText>
          <KText variant="footnote" color="ink2">
            {t('starter.next.detail')}
          </KText>
        </View>
      </KCard>
    </SettingsScroll>
  );
}

function StarterRow({ entry, own, onPress }: { entry: StarterEntry; own: Ownership; onPress: () => void }) {
  const { colors, isAccessibilitySize: ax } = useTheme();
  // A piece seen in his checks is his: it can't be untapped here (its own page removes it).
  const locked = own.owned && own.how === 'closet';
  const status = own.owned ? (own.how === 'closet' ? t('starter.inCloset') : t('starter.marked')) : null;
  const price = t('starter.price', { a: entry.budget, b: entry.mid });
  const art = (
    <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
      {entry.pick ? <PieceArt item={{ garment: entry.pick.garment, hex: displayHex(entry.pick.garment.color_family), name: entry.pick.name }} size={34} /> : <Icon name="closet" size={20} color={colors.ink3} />}
    </View>
  );
  const toggle = (
    <View
      style={{
        width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
        backgroundColor: own.owned ? colors.ink : 'transparent', borderWidth: own.owned ? 0 : 1.5, borderColor: colors.line,
      }}
    >
      {own.owned ? <Icon name="check" size={14} weight="bold" color={colors.surface} /> : null}
    </View>
  );
  return (
    <Pressable
      onPress={locked ? undefined : onPress}
      disabled={locked}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: own.owned, disabled: locked }}
      accessibilityLabel={`${entry.name}. ${price}${status ? `. ${status}` : ''}`}
      accessibilityHint={locked ? t('starter.a11y.detected') : t('starter.a11y.toggleHint')}
      style={({ pressed }) => ({
        flexDirection: ax ? 'column' : 'row', alignItems: ax ? 'stretch' : 'center', gap: space.m, minHeight: 60, paddingVertical: space.s, paddingHorizontal: space.l,
        opacity: pressed ? opacity.pressed : 1,
      })}
    >
      {ax ? (
        // At the largest text sizes the picture and the toggle share a top line, and the words get the full width.
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {art}
          {toggle}
        </View>
      ) : (
        art
      )}
      <View style={{ flex: ax ? undefined : 1, gap: 2 }}>
        <KText variant="subheadline" weight="600">
          {entry.name}
        </KText>
        <KText variant="footnote" color="ink2">
          {price}
        </KText>
        {status ? (
          <KText variant="footnote" color="ink2">
            {status}
          </KText>
        ) : null}
      </View>
      {ax ? null : toggle}
    </Pressable>
  );
}

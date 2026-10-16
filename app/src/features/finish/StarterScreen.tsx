// C5 · Starter essentials (02 C5; 10-onboarding.md §9.3): move 1's destination. "You probably own a few already. Tap the
// ones you have." The 12 essentials with their budget and mid prices; pieces seen in his checks are already ticked
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
import { NEXT_STEP, ownedCount, ownership, STARTER, type Ownership, type StarterEntry } from './starter';
import { toggleStarter } from './starterActions';

export function StarterScreen() {
  const closet = useLive(['closet'], () => store.closet.all(), []);
  const marks = useLive(['kv'], () => getStarterMarks(store), [], STARTER_MARKS_KEY);
  if (!closet || !marks) return null;
  const own = ownership(closet, marks);
  const n = ownedCount(own);
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
        <View accessible accessibilityLabel={t('starter.a11y.count', { n })} style={{ gap: space.s }}>
          <KText variant="headline">{t('closet.essentials.count', { n })}</KText>
          <SlotBar owned={n} />
        </View>
      </View>
      <KCard radius={20}>
        {STARTER.map((e, i) => (
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

/** C1's 12-slot bar: owned = ink, missing = surface2. */
function SlotBar({ owned }: { owned: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {Array.from({ length: 12 }, (_, i) => (
        <View key={i} style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: i < owned ? colors.ink : colors.surface2 }} />
      ))}
    </View>
  );
}

function StarterRow({ entry, own, onPress }: { entry: StarterEntry; own: Ownership; onPress: () => void }) {
  const { colors } = useTheme();
  // A piece seen in his checks is his: it can't be untapped here (its own page removes it).
  const locked = own.owned && own.how === 'closet';
  const status = own.owned ? (own.how === 'closet' ? t('starter.inCloset') : t('starter.marked')) : null;
  const price = t('starter.price', { a: entry.budget, b: entry.mid });
  return (
    <Pressable
      onPress={locked ? undefined : onPress}
      disabled={locked}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: own.owned, disabled: locked }}
      accessibilityLabel={`${entry.name}. ${price}${status ? `. ${status}` : ''}`}
      accessibilityHint={locked ? t('starter.a11y.detected') : t('starter.a11y.toggleHint')}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', gap: space.m, minHeight: 60, paddingVertical: space.s, paddingHorizontal: space.l,
        opacity: pressed ? opacity.pressed : 1,
      })}
    >
      <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
        {entry.pick ? <PieceArt item={{ garment: entry.pick.garment, hex: displayHex(entry.pick.garment.color_family), name: entry.pick.name }} size={34} /> : <Icon name="closet" size={20} color={colors.ink3} />}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <KText variant="subheadline" weight="600">
          {entry.name}
        </KText>
        <KText variant="footnote" color="ink2">
          {status ? `${price} · ${status}` : price}
        </KText>
      </View>
      <View
        style={{
          width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
          backgroundColor: own.owned ? colors.ink : 'transparent', borderWidth: own.owned ? 0 : 1.5, borderColor: colors.line,
        }}
      >
        {own.owned ? <Icon name="check" size={14} weight="bold" color={colors.surface} /> : null}
      </View>
    </Pressable>
  );
}

// C5 · What you already own (02 C5; 10-onboarding.md §9.3, §9.11, #343). Optional, and said so. 12 plain rows, no
// prices, no count bar, no buy card: buying ideas wait for Closet's Next best buy, once the closet can back them. A tap
// asks "Which one is yours?" (the row's realistic kinds and colors) and adds that piece; a row he added opens the same
// choices plus Remove. Pieces seen in his checks are "In your closet" and locked here (their own page changes them).
import { ActionSheetIOS, Platform, Pressable, View } from 'react-native';
import { displayHex } from '@kitted/core';
import { Icon, KCard, KText, RowDivider, opacity, space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import type { ClosetItemRow } from '@/data/types';
import { useLive } from '@/data/useLive';
import { PieceArt } from '@/features/closet/GarmentArt';
import { SettingsScroll } from '@/features/settings/SettingsList';
import { showToast, TOAST_MS_REMOVAL } from '@/features/toast/toast';
import { t } from '@/i18n/en';
import { newId } from '@/services/ids';
import { sessionClock } from '@/state/session';
import { getStarterMarks, STARTER_MARKS_KEY } from './service';
import { optionName, ownedGarment, ownership, STARTER, type Ownership, type StarterEntry, type StarterOption } from './starter';
import { pickStarter, removeStarter, toggleMarkOnly, type StarterToast } from './starterActions';

/** A pick or the belt's mark: 5 s. Remove: 8 s, like every removal (#324). */
const toast = (x: StarterToast | null) => {
  if (!x) return;
  const { text, undo } = x;
  showToast(text, undo);
};
const toastRemoved = (x: StarterToast | null) => {
  if (!x) return;
  const { text, undo } = x;
  showToast(text, undo, { ms: TOAST_MS_REMOVAL });
};

/** "Which one is yours?": the row's choices, plus Remove when he added it. The web preview takes the first choice. */
function askWhich(e: StarterEntry, added: boolean) {
  const now = () => sessionClock.nowMs();
  const pick = (o: StarterOption) => void pickStarter(store, e, o, newId, now()).then(toast);
  if (Platform.OS !== 'ios') {
    const first = e.owns[0];
    if (first) pick(first);
    return;
  }
  const labels = e.owns.map((o) => optionName(e, o));
  const options = [...labels, ...(added ? [t('starter.remove')] : []), t('common.cancel')];
  ActionSheetIOS.showActionSheetWithOptions(
    { title: t('starter.which'), options, cancelButtonIndex: options.length - 1, destructiveButtonIndex: added ? labels.length : undefined },
    (i) => {
      const o = e.owns[i];
      if (o) pick(o);
      else if (added && i === labels.length) void removeStarter(store, e, now()).then(toastRemoved);
    },
  );
}

export function StarterScreen() {
  const closet = useLive(['closet'], () => store.closet.all(), []);
  const marks = useLive(['kv'], () => getStarterMarks(store), [], STARTER_MARKS_KEY);
  if (!closet || !marks) return null;
  const own = ownership(closet, marks);
  const byId = new Map(closet.map((c) => [c.id, c]));
  const tap = (e: StarterEntry, o: Ownership) => {
    if (e.owns.length === 0) void toggleMarkOnly(store, e, sessionClock.nowMs()).then(toast);
    else askWhich(e, o.owned && o.how === 'marked');
  };
  return (
    <SettingsScroll>
      <View style={{ paddingHorizontal: space.xs }}>
        <KText variant="subheadline" color="ink2">
          {t('starter.sub')}
        </KText>
      </View>
      <KCard radius={20}>
        {STARTER.map((e, i) => {
          const o = own[e.id] ?? { owned: false };
          const piece = o.owned && o.itemId ? byId.get(o.itemId) ?? null : null;
          return (
            <View key={e.id}>
              {i > 0 ? <RowDivider /> : null}
              <StarterRow entry={e} own={o} piece={piece} onPress={() => tap(e, o)} />
            </View>
          );
        })}
      </KCard>
    </SettingsScroll>
  );
}

function StarterRow({ entry, own, piece, onPress }: { entry: StarterEntry; own: Ownership; piece: ClosetItemRow | null; onPress: () => void }) {
  const { colors, isAccessibilitySize: ax } = useTheme();
  // A piece seen in his checks is his: it can't be changed here (its own page does that).
  const locked = own.owned && own.how === 'closet';
  const status = !own.owned ? null : own.how === 'closet' ? t('starter.inCloset') : piece ? t('starter.added', { item: piece.name }) : t('starter.marked');
  // Not his yet: the kind drawn in a neutral grey, so the picture never suggests a color he hasn't said.
  const first = entry.owns[0];
  const neutral = first ? ownedGarment(entry, { ...first, color: 'light_grey' }) : null;
  const art = (
    <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
      {piece ? (
        <PieceArt item={piece} size={34} />
      ) : neutral ? (
        <PieceArt item={{ garment: neutral, hex: displayHex('light_grey'), name: entry.name }} size={34} />
      ) : (
        <Icon name="closet" size={20} color={colors.ink3} />
      )}
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
  const hint = locked ? t('starter.a11y.detected') : entry.owns.length === 0 ? t('starter.a11y.toggleHint') : own.owned ? t('starter.a11y.changeHint') : t('starter.a11y.pickHint');
  return (
    <Pressable
      onPress={locked ? undefined : onPress}
      disabled={locked}
      accessibilityRole="button"
      accessibilityState={{ disabled: locked }}
      accessibilityLabel={`${entry.name}${status ? `. ${status}` : ''}`}
      accessibilityHint={hint}
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

// The fact rows of Y1 and Y3 (02 D17 / Y3, revised #246): the fact (16 semibold) over its source line (13, ink3) and a
// chevron; a tap opens the fact sheet. A guess is a question with Yes / Not really inline (never stated as fact).
// Delete is a long-press menu and a VoiceOver action (a swipe needs a gesture root the app doesn't have), and the
// fact sheet's Delete; each soft-deletes with "Forgot it." + Undo.
import { ActionSheetIOS, Platform, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import type { ZoneOffset } from '@kitted/core';
import { Icon, KButton, KCard, KText, radius, RowDivider, opacity, space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import type { FactRow } from '@/data/types';
import { t } from '@/i18n/en';
import { sessionClock } from '@/state/session';
import { confirmGuess, factSpoken, factTitle, forgetWithUndo, sourceLine } from './facts';

const open = (id: string) => router.push(`/sheets/fact/${id}`);

function deleteMenu(f: FactRow) {
  if (Platform.OS !== 'ios') return;
  ActionSheetIOS.showActionSheetWithOptions(
    { title: factTitle(f), options: [t('common.delete'), t('common.cancel')], destructiveButtonIndex: 0, cancelButtonIndex: 1 },
    (i) => {
      if (i === 0) void forgetWithUndo(store, f.id);
    },
  );
}

function FactItem({ f, zone }: { f: FactRow; zone: ZoneOffset }) {
  const { isAccessibilitySize } = useTheme();
  const guess = f.source === 'guess';
  const head = (
    <Pressable
      onPress={() => open(f.id)}
      onLongPress={() => deleteMenu(f)}
      accessibilityRole="button"
      accessibilityLabel={factSpoken(f, zone)}
      accessibilityActions={[{ name: 'activate' }, { name: 'delete', label: t('common.delete') }]}
      onAccessibilityAction={(e) => (e.nativeEvent.actionName === 'delete' ? void forgetWithUndo(store, f.id) : open(f.id))}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', gap: space.m, minHeight: 52,
        paddingHorizontal: space.rowX, paddingTop: space.rowY, paddingBottom: guess ? space.s : space.rowY, opacity: pressed ? opacity.pressed : 1,
      })}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <KText variant="callout" weight={guess ? '500' : '600'}>
          {factTitle(f)}
        </KText>
        <KText variant="footnote" color="ink3">
          {sourceLine(f, zone)}
        </KText>
      </View>
      {guess ? null : <Icon name="next" size="small" color="ink3" weight="semibold" scalesWithText />}
    </Pressable>
  );
  if (!guess) return head;
  return (
    <View>
      {head}
      <View style={{ flexDirection: isAccessibilitySize ? 'column' : 'row', gap: space.s, paddingHorizontal: space.rowX, paddingBottom: space.rowY - 4 }}>
        <View style={{ flex: isAccessibilitySize ? undefined : 1 }}>
          <KButton kind="secondary" size="regular" fullWidth title={t('you.guess.yes')} onPress={() => void confirmGuess(store, f.id, sessionClock.nowMs())} />
        </View>
        <View style={{ flex: isAccessibilitySize ? undefined : 1 }}>
          <KButton kind="secondary" size="regular" fullWidth title={t('you.guess.no')} onPress={() => void forgetWithUndo(store, f.id)} />
        </View>
      </View>
    </View>
  );
}

/** A card of fact rows (Y1: the 4 newest; Y3: all), or the empty line. */
export function FactCard({ facts }: { facts: readonly FactRow[] }) {
  const zone = sessionClock.offset;
  return (
    <KCard radius={radius.cardSmall}>
      {facts.length === 0 ? (
        <KText variant="subheadline" color="ink2" style={{ paddingVertical: space.rowY, paddingHorizontal: space.rowX }}>
          {t('you.facts.empty')}
        </KText>
      ) : (
        facts.map((f, i) => (
          <View key={f.id}>
            {i > 0 ? <RowDivider inset={space.rowX} /> : null}
            <FactItem f={f} zone={zone} />
          </View>
        ))
      )}
    </KCard>
  );
}

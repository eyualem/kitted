// The scan inbox (09-ui-review §1 item 11, #280): the clothes photos waiting on the phone until reading clothes from
// photos exists (#100). Each scan's thumbnail and when it was saved, the existing "coming soon" line, and Delete,
// which removes the entry and its three files (kept, thumbnail, face-hidden copy) from the phone after one confirm.
// Opened from the Closet row "Waiting to be read · N photos". Nothing here is sent anywhere.
import { useEffect } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Icon, KText, opacity, radius, space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import { SheetScaffold } from '@/features/sheet/SheetScaffold';
import { deleteScanFiles } from '@/features/privacy/files';
import { resolveStoredPath } from '@/services/photoFiles';
import { sessionClock } from '@/state/session';
import { t } from '@/i18n/en';
import { deleteScan, inboxSheet, INBOX_KEY, parseInbox } from './inbox';
import { SimFlatLay } from './SimFlatLay';

const THUMB = 64;

function confirmDelete(sha256: string) {
  Alert.alert(t('scan.inbox.deleteTitle'), t('scan.inbox.deleteBody'), [
    { text: t('common.cancel'), style: 'cancel' },
    { text: t('common.delete'), style: 'destructive', onPress: () => void deleteScan(store, sha256, deleteScanFiles) },
  ]);
}

export function ScanInboxSheet() {
  const { colors } = useTheme();
  const list = useLive(['kv'], async () => parseInbox(await store.getKv(INBOX_KEY)), [], INBOX_KEY);
  const now = sessionClock.nowMs();
  const sheet = list ? inboxSheet(list, now, sessionClock.offset) : null;
  // The last one deleted: nothing left to show.
  const empty = !!list && list.length === 0;
  useEffect(() => {
    if (empty && router.canGoBack()) router.back();
  }, [empty]);

  return (
    <SheetScaffold title={t('scan.inbox.title')} subtitle={sheet?.line}>
      <View style={{ gap: space.m, paddingTop: space.xs }}>
        {(sheet?.rows ?? []).map((r) => {
          const uri = r.thumb ? resolveStoredPath(r.thumb) : null;
          return (
            <View key={r.sha256} style={{ flexDirection: 'row', alignItems: 'center', gap: space.m }}>
              <View
                accessible
                accessibilityLabel={t('scan.inbox.a11y.photo', { date: r.date })}
                style={{ width: THUMB, height: THUMB, borderRadius: radius.tile, borderCurve: 'continuous', overflow: 'hidden', backgroundColor: colors.surface2 }}
              >
                {uri ? (
                  <Image source={uri} style={{ width: THUMB, height: THUMB }} contentFit="cover" transition={0} />
                ) : r.demo ? (
                  <SimFlatLay width={THUMB} height={THUMB} state="good" />
                ) : null}
              </View>
              <KText variant="callout" style={{ flex: 1 }} accessibilityElementsHidden importantForAccessibility="no">
                {r.date}
              </KText>
              <Pressable
                onPress={() => confirmDelete(r.sha256)}
                accessibilityRole="button"
                accessibilityLabel={t('scan.inbox.a11y.delete', { date: r.date })}
                hitSlop={8}
                style={({ pressed }) => ({ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', opacity: pressed ? opacity.pressed : 1 })}
              >
                <Icon name="trash" size="regular" color="ink2" />
              </Pressable>
            </View>
          );
        })}
      </View>
    </SheetScaffold>
  );
}

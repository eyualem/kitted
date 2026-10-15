// One thread row: a stylist line, his bubble, his photo, or a card (02 D12).
import { router } from 'expo-router';
import { View } from 'react-native';
import { Chip, ChipFlow, DayStamp, KButton, PhotoBubble, StylistMessage, UserBubble } from '@/design-system';
import { store } from '@/data/db';
import type { ChatMessage } from '@/data/types';
import { useLive } from '@/data/useLive';
import { shownPhoto } from '@/demo/demoPhotos';
import { useFitCheckSession } from '@/features/fitcheck/session';
import { MorningCard } from '@/features/morning/MorningCard';
import { t } from '@/i18n/en';
import { clockTime } from '@/i18n/format';
import { sessionClock } from '@/state/session';
import { FitCheckCard } from './cards/FitCheckCard';
import { OutfitIdeaCard } from './cards/OutfitIdeaCard';
import { RecheckCard } from './cards/RecheckCard';
import { WhichOneCard } from '@/features/whichOne/WhichOneCard';
import { SupportCard } from '@/features/ask/SupportCard';
import { HeldReadyCard } from '@/features/held/HeldReadyCard';
import { LimitCard } from '@/features/held/LimitCard';
import { retryQuestion } from './ask';
import { occasionLabel, type ThreadItem } from './thread';

/** `readOnly`: Past chats (#276): an earlier day's check cards can't be changed, only read (Why, the photo). */
export function ThreadRow({ item, readOnly = false }: { item: ThreadItem; readOnly?: boolean }) {
  if (item.type === 'stamp') return <DayStamp>{item.text}</DayStamp>;
  const m = item.message;
  if (m.kind === 'photo') return <PhotoMessage m={m} />;
  if (m.kind === 'card') {
    if (m.cardType === 'fitCheck' && m.fitCheckId) return <FitCheckCard checkId={m.fitCheckId} readOnly={readOnly} />;
    if (m.cardType === 'recheck' && m.fitCheckId) return <RecheckCard checkId={m.fitCheckId} readOnly={readOnly} />;
    if (m.cardType === 'outfitIdea' && m.outfitId) return <OutfitIdeaCard outfitId={m.outfitId} />;
    if (m.cardType === 'morning' && typeof m.payload.ideaId === 'string') return <MorningCard ideaId={m.payload.ideaId} />;
    if (m.cardType === 'question' && m.payload.question === 'whichOne') return <WhichOneCard m={m} />;
    if (m.cardType === 'support') return <SupportCard />;
    // The check limit (02 D19 S17 → S17h, #280): under the photo he took after the free check was used.
    // …and after 4 am, "Ready to score last night's photo?" (S17h, #281).
    if (m.cardType === 'held' && m.fitCheckId && m.payload.ready === true) return <HeldReadyCard checkId={m.fitCheckId} showHeader={item.showWho} readOnly={readOnly} />;
    if (m.cardType === 'held' && m.fitCheckId) return <LimitCard checkId={m.fitCheckId} readOnly={readOnly} />;
    // The question limit (02 S25): stylist text, with "Try Pro" once the paywall exists.
    if (m.cardType === 'limit') {
      return (
        <StylistMessage
          showHeader={item.showWho}
          footer={m.payload.tryPro === true ? <ActionRow title={t('limit.proNoTrial')} onPress={() => router.push('/paywall')} /> : null}
        >
          {m.text ?? ''}
        </StylistMessage>
      );
    }
    return null;
  }
  const text = m.payload.aiNote ? t('stylist.aiNote') : m.text ?? '';
  if (m.role === 'user') return <UserBubble>{text}</UserBubble>;
  // fail.ask (07 §6.4): Retry asks the same question again, in this line's place, while it's the newest row.
  if (typeof m.payload.askRetry === 'string') {
    return (
      <StylistMessage showHeader={item.showWho} footer={item.newest ? <ActionRow title={t('common.retry')} onPress={() => retryQuestion(m.id)} /> : null}>
        {text}
      </StylistMessage>
    );
  }
  return (
    <StylistMessage
      showHeader={item.showWho}
      footer={
        item.newest && m.chips.length > 0 ? (
          <View style={{ paddingTop: 6 }}>
            <ChipFlow>
              {m.chips.map((c) => (
                <Chip key={c} title={c} />
              ))}
            </ChipFlow>
          </View>
        ) : null
      }
    >
      {text}
    </StylistMessage>
  );
}

/** One button under a stylist line (Retry, Try Pro). */
function ActionRow({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <View style={{ paddingTop: 6, alignItems: 'flex-start' }}>
      <KButton title={title} kind="secondary" size="regular" onPress={onPress} />
    </View>
  );
}

/** His photo: neck-down, with the caption that follows the check (reading / occasion / re-check / failure). */
function PhotoMessage({ m }: { m: ChatMessage }) {
  const session = useFitCheckSession();
  const row = useLive(['fitChecks'], () => (m.fitCheckId ? store.fitChecks.get(m.fitCheckId) : Promise.resolve(null)), [m.fitCheckId], m.fitCheckId);
  const photo = shownPhoto(m.payload.photoId ?? row?.demoPhotoId, m.payload.photoUri ?? row?.photoFile, m.payload.aspect);
  if (!photo) return null;
  const snap = m.payload.snap === true;
  const reading = !!row && (row.status === 'scoring' || (snap && session.kind === 'reading' && session.checkId === row.id && session.mode === 'shoeSnap'));
  let caption: string | undefined;
  if (snap) caption = t('cam.shoe.bubbleCap');
  else if (row?.status === 'failed') caption = t('fail.cap.notScored');
  else if (row?.parentId) caption = t('recheck.bubbleCap');
  else if (row) caption = occasionLabel(row.occasion);
  return (
    <PhotoBubble
      source={photo.source}
      aspect={photo.aspect}
      crop={photo.crop}
      occasion={caption}
      time={clockTime(m.createdAt, sessionClock.offset)}
      reading={reading}
      onPress={row ? () => router.push(`/photo/${row.id}`) : undefined}
    />
  );
}

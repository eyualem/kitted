// One thread row: a stylist line, his bubble, his photo, or a card (02 D12).
import type React from 'react';
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
import { AskAttachment } from '@/features/ask/AskCardView';
import { FollowUpRow } from '@/features/ask/FollowUpRow';
import { attachmentEnters, Enter } from './Enter';
import { AnswerBody, answerLayout, chipActions, useAnswerCloset } from '@/features/ask/AnswerBody';
import { HeldReadyCard } from '@/features/held/HeldReadyCard';
import { LimitCard } from '@/features/held/LimitCard';
import { AccountOfferCard } from '@/features/account/AccountOfferCard';
import { AboutYouCard } from '@/features/aboutYou/AboutYouCard';
import { NoConsentCard } from '@/features/onboarding/NoConsentCard';
import { FirstCheckOfferCard } from '@/features/onboarding/FirstCheckOfferCard';
import { InviteCard } from '@/features/finish/InviteCard';
import { NotifyAskCard } from '@/features/finish/NotifyAskCard';
import { retryQuestion } from './ask';
import { occasionLabel, type ThreadItem } from './thread';

/** `readOnly`: Past chats (#276): an earlier day's check cards can't be changed, only read (Why, the photo). */
/** `enter`: the just-finished answer's card and taps get their own beat (log #496); the screen says when, Past chats never. */
export function ThreadRow({ item, readOnly = false, followUps, enter }: { item: ThreadItem; readOnly?: boolean; followUps?: readonly string[]; enter?: boolean }) {
  if (item.type === 'stamp') return <DayStamp>{item.text}</DayStamp>;
  const m = item.message;
  if (m.kind === 'photo') return <PhotoMessage m={m} />;
  if (m.kind === 'card') {
    if (m.cardType === 'fitCheck' && m.fitCheckId) return <FitCheckCard checkId={m.fitCheckId} readOnly={readOnly} />;
    if (m.cardType === 'recheck' && m.fitCheckId) return <RecheckCard checkId={m.fitCheckId} readOnly={readOnly} />;
    if (m.cardType === 'outfitIdea' && m.outfitId) return <OutfitIdeaCard outfitId={m.outfitId} readOnly={readOnly} />;
    if (m.cardType === 'morning' && typeof m.payload.ideaId === 'string') return <MorningCard ideaId={m.payload.ideaId} readOnly={readOnly} />;
    if (m.cardType === 'question' && m.payload.question === 'whichOne') return <WhichOneCard m={m} />;
    // The end of onboarding (ruling 23, 10-onboarding.md §9): "Your first 3 moves", then the notification ask.
    if (m.cardType === 'plan' && m.fitCheckId) return <InviteCard m={m} readOnly={readOnly} />;
    if (m.cardType === 'question' && m.payload.question === 'notify') return <NotifyAskCard m={m} showHeader={item.showWho} readOnly={readOnly} />;
    if (m.cardType === 'support') return <SupportCard />;
    // "Keep your fits" (A3, #289): after his first score, at most twice.
    if (m.cardType === 'account') return <AccountOfferCard m={m} showHeader={item.showWho} readOnly={readOnly} />;
    // "About you" (#373, 10-onboarding.md §10): height, build and fit, after the first score.
    if (m.cardType === 'aboutYou') return <AboutYouCard m={m} showHeader={item.showWho} readOnly={readOnly} />;
    // "Turn on fit checks" (S26, 09-ui-review §20.8 G23): after "Not now" on consent.
    if (m.cardType === 'turnOnChecks') return <NoConsentCard m={m} showHeader={item.showWho} readOnly={readOnly} />;
    if (m.cardType === 'firstCheckOffer') return <FirstCheckOfferCard m={m} readOnly={readOnly} />;
    // The check limit (02 D19 S17 → S17h, #280): under the photo he took after the free check was used.
    // …and after 4 am, "Ready to score last night's photo?" (S17h, #281).
    if (m.cardType === 'held' && m.fitCheckId && m.payload.ready === true) return <HeldReadyCard checkId={m.fitCheckId} showHeader={item.showWho} readOnly={readOnly} />;
    if (m.cardType === 'held' && m.fitCheckId) return <LimitCard checkId={m.fitCheckId} readOnly={readOnly} />;
    // The question limit (02 S25): stylist text, with "Try Pro" once the paywall exists (paywallOn when it was posted).
    if (m.cardType === 'limit') {
      return (
        <StylistMessage
          showHeader={item.showWho}
          footer={m.payload.tryPro === true ? <ActionRow title={t('limit.proNoTrial')} onPress={() => router.push('/paywall?from=ask')} /> : null}
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
  // An answer's one card and its "Saved to what I know · Undo" (07 §1, §4).
  const attached = m.payload.askCard !== undefined || typeof m.payload.savedFact === 'string';
  // The follow-up taps (KC1.3) under the latest answer only: the screen passes them to that one row; Past chats never do.
  const enters = attachmentEnters(enter, readOnly);
  const taps = !readOnly && followUps?.length ? <FollowUpRow taps={followUps} enter={enters} /> : null;
  if (item.answer) {
    return (
      <AnswerMessage
        m={m}
        showHeader={item.showWho}
        footer={
          attached || taps ? (
            <>
              {attached ? (
                <Enter on={enters}>
                  <AskAttachment m={m} readOnly={readOnly} />
                </Enter>
              ) : null}
              {taps}
            </>
          ) : null
        }
      />
    );
  }
  return (
    <StylistMessage
      showHeader={item.showWho}
      footer={
        attached ? (
          <AskAttachment m={m} readOnly={readOnly} />
        ) : item.newest && m.chips.length > 0 ? (
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

/** An answer to his question, look C (#302): the lead, the reason and his pieces as chips. */
function AnswerMessage({ m, showHeader, footer }: { m: ChatMessage; showHeader: boolean; footer: React.ReactNode }) {
  const closet = useAnswerCloset();
  const text = m.text ?? '';
  const layout = answerLayout(text, closet);
  return (
    <StylistMessage showHeader={showHeader} body={<AnswerBody layout={layout} />} actions={chipActions(layout.chips)} footer={footer}>
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
  if (snap) caption = t(m.payload.snapPart === 'bottom' ? 'cam.bottom.bubbleCap' : 'cam.shoe.bubbleCap');
  // "Not sent" when no connection kept it on the phone (09 §20.8 G18.5); any other failure was sent but not scored.
  else if (row?.status === 'failed') caption = t(row.details.failCode === 'offline' ? 'fail.cap.notSent' : 'fail.cap.notScored');
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

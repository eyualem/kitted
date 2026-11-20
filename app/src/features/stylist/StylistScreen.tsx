// S1 Stylist (02 D12): today's thread (newest at the bottom) and the composer.
// Chats are kept by day (founder, Oct 9): this is today's (4 am day key); earlier days open from
// "Past chats", by the header's clock button only (#338: the "Earlier chats" pill floated above a short day). A day is a handful of rows, so a plain ScrollView, not a FlatList: it scrolls to
// its real end (FlatList's cached row heights stopped short as cards grew), and iOS 26 can shrink
// the tab bar on scroll only when the screen's first view is a ScrollView (FlatList unsupported).
// Not inverted: on iOS 26 the scroll-edge fade washes out a flipped list (DECISIONS-LOG #25).
// The "Ask your stylist…" bar is the tab bar's accessory (StylistBar); tapping it opens the dock
// here, which rides the keyboard. No KeyboardAvoidingView: its padding stacked on the dock's fixed
// bottom. The thread's footer grows with the dock instead, the scroll offset following, so the
// newest message stays in view.
// A question's answer streams into an in-memory row drawn after the thread (features/ask/live.ts), so the chat
// table is written once per answer, not per word.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, Keyboard, Platform, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import Animated, { type SharedValue, scrollTo, useAnimatedKeyboard, useAnimatedReaction, useAnimatedRef, useAnimatedStyle, useDerivedValue, useScrollOffset, useSharedValue, withTiming } from 'react-native-reanimated';
import { router, useFocusEffect, useIsFocused } from 'expo-router';
import { dayKey } from '@kitted/core';
import { space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import type { ChatMessage } from '@/data/types';
import { useLive } from '@/data/useLive';
import { starterChips } from '@/features/ask/chips';
import { clearStylistAction, usePendingStylistAction } from '@/router/stylistAction';
import { LAUNCHED_AT, sessionClock } from '@/state/session';
import { setToastFloor, useToast } from '@/features/toast/toast';
import { morning } from '@/features/morning';
import { firstCheckPending } from '@/features/onboarding/firstCheckOffer';
import { liveAnswer, useAskInFlight, useLiveAnswer } from '@/features/ask/live';
import { LiveAnswerRow, liveRowShows } from '@/features/ask/LiveAnswerRow';
import { latestFollowUps } from '@/features/ask/pipeline';
import { Composer } from './Composer';
import { sendQuestion } from './ask';
import { ACCESSORY_H, COMPOSER_BOTTOM, DOCK_GAP, KEYBOARD_GAP, THREAD_PAD } from './layout';
import { ThreadRow } from './MessageView';
import { ARRIVE, arrivals, parseSeenUntil, SEEN_UNTIL_KEY } from './arrival';
import { arrivalEntering } from './arrivalMotion';
import { KitTypingRow } from './KitTypingRow';
import { useTypingBeat } from './useTypingBeat';
import { getTourStop } from '@/features/onboarding/appTour';
import { OfflineBanner } from './OfflineBanner';
import { LatestPill } from './LatestPill';
import { AT_BOTTOM_PT, latestPillShows } from './latestShows';
import { useNet } from '@/services/connectivity';
import { buildThreadItems, liveGap, splitToday, withoutMorningWhileFirstCheckPending } from './thread';
import { composerState, useComposerOpen } from './composerState';
import { threadGrow } from './threadGrow';
import { useAccountOffer } from '@/features/account/offerSession';
import { useAboutYou } from '@/features/aboutYou/session';
import { useFinishSequence } from '@/features/finish/session';

/** No tab-bar accessory off iOS (the web preview): the composer stays docked. */
const DOCK_ALWAYS = Platform.OS !== 'ios';

const EXCHANGE_MS = 10 * 60_000;
const SHEET_DISMISS_MS = 400;
/** Room a toast takes above the dock (44 tall + 8 gap + a little air), DECISIONS-LOG #56. */
const TOAST_ROOM = 56;

export function StylistScreen() {
  const { colors, a11y } = useTheme();
  // Reduce Motion: the thread jumps to new rows instead of scrolling to them (07 §17, U16).
  const motion = !a11y.reduceMotion;
  const screenReader = useScreenReaderRef();
  const loaded = useLive(['chat'], () => store.chat.all(), []);
  const all = useMemo(() => loaded ?? [], [loaded]);
  const now = sessionClock.nowMs();
  const { today: messages } = useMemo(() => splitToday(all, now, sessionClock.offset), [all, now]);
  const live = useLiveAnswer();
  const askInFlight = useAskInFlight();
  // Offline (09 §20.8 G18.3): send and the starter chips wait; his words stay in the field.
  const net = useNet();
  // The starter chips (07 §6.3): from his closet and today's checks.
  // Reloaded on a new day too, so yesterday's "Why a 7.0?" doesn't greet him in the morning (U10).
  const today = dayKey(now, sessionClock.offset);
  const chips = useLive(['closet', 'fitChecks'], async () => starterChips({
    nowMs: sessionClock.nowMs(), zone: sessionClock.offset, closet: await store.closet.all(), checks: await store.fitChecks.all(),
  }), [today]) ?? [];
  // While Retry streams, the failed line it replaces steps aside for the live row.
  const replaced = live?.replaces ?? null;
  // Kit's first-check card is the only card until his first check is scored; a morning card that's already there waits.
  const firstCheckHeld = useLive(['chat', 'fitChecks'], () => firstCheckPending(store), []) ?? false;
  // What Kit's arrival moves (arrival.ts): rows newer than when he last had the thread in front of him. Read once; the
  // thread waits for it (a few ms), since a row that mounts first never gets its entrance.
  const [seenUntil, setSeenUntil] = useState<number | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    void store.getKv(SEEN_UNTIL_KEY).then(
      (raw) => {
        // Never written (an install from before this, or the first launch): what's made during this launch is new.
        if (alive) setSeenUntil(parseSeenUntil(raw) ?? sessionClock.nowMs() - (Date.now() - LAUNCHED_AT));
      },
      () => alive && setSeenUntil(Number.POSITIVE_INFINITY),
    );
    return () => {
      alive = false;
    };
  }, []);
  // In front of him? A new row of Kit's waits for that (arrival.ts), or it would move where he can't see it: the tab
  // mounts as setup's end slides it in, and on another tab it is out of sight.
  const onTab = useIsFocused();
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(true), ARRIVE.settleMs);
    return () => clearTimeout(timer);
  }, []);
  const focused = onTab && settled;
  const kept = useMemo(() => withoutMorningWhileFirstCheckPending(messages, firstCheckHeld), [messages, firstCheckHeld]);
  // Kit types before it speaks: the hello after setup and the line after his first score wait out the dots (T116).
  const beat = useTypingBeat(kept, seenUntil, focused);
  const shown = useMemo(() => {
    const rows = (replaced ? kept.filter((m) => m.id !== replaced) : kept).filter((m) => !beat.held.has(m.id));
    return focused || seenUntil === undefined ? rows : rows.filter((m) => !arrivals.isNew(m, seenUntil));
  }, [kept, replaced, beat.held, focused, seenUntil]);
  const items = useMemo(() => buildThreadItems(shown, now, sessionClock.offset), [shown, now]);
  // The follow-up taps under the latest answer only (KC1.3); his next message hides them.
  const followUps = useMemo(() => latestFollowUps([...shown].sort((a, b) => a.createdAt - b.createdAt)), [shown]);
  const shownIds = useMemo(() => new Set(shown.map((m) => m.id)), [shown]);
  const showLive = liveRowShows(live, shownIds, (at) => dayKey(at, sessionClock.offset) === today);
  // The thread shows the finished answer's own row now: the live copy goes for good (U1, no ghost tomorrow).
  useEffect(() => liveAnswer.settle(shownIds), [shownIds, live]);
  // The answer that just finished streaming has already moved in as the live row; its stored row takes its place still.
  const liveRowId = live?.phase === 'done' ? live.messageId : null;
  if (seenUntil !== undefined && focused) arrivals.plan(shown, seenUntil, liveRowId ? [liveRowId] : []);
  // Once drawn, a row never moves again (a remount of the screen, a row filtered out and back).
  useEffect(() => {
    if (seenUntil !== undefined) arrivals.drawn(items.flatMap((i) => (i.type === 'msg' ? [i.message.id] : [])));
  }, [items, seenUntil]);
  // Written when the thread loses focus or the app leaves the front: the next launch draws what he saw as it was.
  const markSeen = useCallback(() => {
    // Not while the app tour is up: Kit's hello hasn't been seen, and it plays when the tour ends (specs/app-tour.md AT3.2).
    if (getTourStop() !== null) return;
    if (seenUntil !== undefined) void store.setKv(SEEN_UNTIL_KEY, String(sessionClock.nowMs())).catch(() => {});
  }, [seenUntil]);
  useFocusEffect(
    useCallback(() => {
      const sub = AppState.addEventListener('change', (st) => {
        if (st !== 'active') markSeen();
      });
      return () => {
        sub.remove();
        markSeen();
      };
    }, [markSeen]),
  );
  const open = useComposerOpen();
  const docked = DOCK_ALWAYS || open !== null;
  // Leaving the tab closes an empty composer; the accessory comes back with the thread.
  useFocusEffect(useCallback(() => () => composerState.close(), []));
  const lastUser = messages.filter((m) => m.role === 'user').reduce((a, m) => Math.max(a, m.createdAt), 0);
  const mode = now - lastUser < EXCHANGE_MS ? 'compact' : 'idle';
  const openCamera = () => router.push('/camera');

  const list = useAnimatedRef<Animated.ScrollView>();
  const scrollY = useScrollOffset(list);
  const keyboard = useAnimatedKeyboard();
  // How far the dock rises above its resting spot (0 with the keyboard down).
  const lift = useDerivedValue(() => Math.max(0, keyboard.height.value + KEYBOARD_GAP - COMPOSER_BOTTOM));
  useAnimatedReaction(
    () => lift.value,
    (now, before) => {
      if (before === null || now === before) return;
      scrollTo(list, 0, Math.max(0, scrollY.value + now - before), false);
    },
  );
  // A toast sits just above the dock, which used to cover the newest card's buttons ("Logged for
  // today" over Wear this). While one shows, the thread makes room for it and, if he's at the
  // bottom, moves up with it, like the keyboard.
  const toast = useToast();
  const toastRoom = useSharedValue(0);
  const follow = useSharedValue(1);
  useEffect(() => {
    toastRoom.set(withTiming(toast ? TOAST_ROOM : 0, { duration: motion ? 220 : 0 }));
  }, [toast, toastRoom, motion]);
  useAnimatedReaction(
    () => toastRoom.value,
    (now, before) => {
      if (before === null || now === before || !follow.value) return;
      scrollTo(list, 0, Math.max(0, scrollY.value + now - before), false);
    },
  );
  // A card opening or folding (#344): at the bottom, scroll with its height change, frame by frame.
  useAnimatedReaction(
    () => threadGrow.value,
    (now, before) => {
      if (before === null || now === before || !follow.value) return;
      scrollTo(list, 0, Math.max(0, scrollY.value + now - before), false);
    },
  );
  const dockStyle = useAnimatedStyle(() => ({ bottom: COMPOSER_BOTTOM + lift.value }));
  // The dock's measured height: at large text sizes it's far taller than the mockup's, and a fixed
  // pad would leave the newest links under it for good. Never less than the mockup's pad.
  const dockH = useSharedValue(DOCK_ALWAYS ? 0 : ACCESSORY_H);
  const footerStyle = useAnimatedStyle(() => ({ height: Math.max(THREAD_PAD[mode], COMPOSER_BOTTOM + dockH.value + DOCK_GAP) + lift.value + toastRoom.value }));
  const atBottom = useRef(true);
  // The real content and viewport heights. FlatList's scrollToEnd uses its cached row heights,
  // which lag behind a card that grows in stages (the morning card: data, then tiles, then the
  // native pills), so it stopped ~20 pt short. Scrolling to the measured height doesn't.
  const contentH = useRef(0);
  const viewH = useRef(0);
  const toEnd = useCallback(
    (animated: boolean) => {
      const a = animated && motion;
      if (contentH.current > 0 && viewH.current > 0) list.current?.scrollTo({ y: Math.max(0, contentH.current - viewH.current), animated: a });
      else list.current?.scrollToEnd({ animated: a });
    },
    [list, motion],
  );
  const first = useRef(true);
  const toLatest = () => {
    newBelow.current = false;
    pillShown.current = false;
    setPill(false);
    atBottom.current = true;
    follow.set(1);
    toEnd(true);
  };
  // Just above the dock (or the accessory), riding the keyboard like the dock does.
  const pillBase = useSharedValue(COMPOSER_BOTTOM + ACCESSORY_H + DOCK_GAP);
  // Only his finger decides whether the thread follows: the momentum end of our own animated
  // scrollToEnd (content still growing under it) used to read as "scrolled up" and stop it.
  const dragging = useRef(false);
  const onUserScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    atBottom.current = contentSize.height - contentOffset.y - layoutMeasurement.height < AT_BOTTOM_PT;
    follow.set(atBottom.current ? 1 : 0);
  };
  // The Latest pill (02 G3, 09 §23 L1): scrolled up more than a screen, or scrolled up while something new came in.
  const [pill, setPill] = useState(false);
  const pillShown = useRef(false);
  const newBelow = useRef(false);
  const offsetY = useRef(0);
  // Only when it turns on or off: a render on every scroll or size change (a toast growing the footer included) left a
  // toast's entering animation stuck invisible on iOS (#118, #353).
  const updatePill = () => {
    if (contentH.current - offsetY.current - viewH.current < AT_BOTTOM_PT) newBelow.current = false;
    const next = latestPillShows({ contentH: contentH.current, viewH: viewH.current, offsetY: offsetY.current, newBelow: newBelow.current });
    if (next === pillShown.current) return;
    pillShown.current = next;
    setPill(next);
  };
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    offsetY.current = e.nativeEvent.contentOffset.y;
    updatePill();
  };
  const onDragEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    onUserScroll(e);
    if (!e.nativeEvent.velocity?.y) dragging.current = false;
  };
  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!dragging.current) return;
    dragging.current = false;
    onUserScroll(e);
  };

  // A card that changes from a sheet (S21 "Update score", S10 a pair of shoes) grows while the
  // sheet closes, and the dismissal swallows that scroll. Follow it again once the sheet is gone
  // (~350 ms on iOS 26; focus fires at the start of the dismissal). DECISIONS-LOG #34.
  const dockTop = useRef(COMPOSER_BOTTOM + ACCESSORY_H);
  useEffect(() => {
    if (docked) return;
    // Closed: toasts sit above the accessory's capsule.
    dockTop.current = COMPOSER_BOTTOM + ACCESSORY_H;
    setToastFloor(dockTop.current);
    pillBase.set(dockTop.current + DOCK_GAP);
  }, [docked, pillBase]);
  useFocusEffect(
    useCallback(() => {
      setToastFloor(dockTop.current);
      return () => setToastFloor(0);
    }, []),
  );
  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
        if (atBottom.current && !first.current) toEnd(true);
      }, SHEET_DISMISS_MS);
      return () => clearTimeout(timer);
    }, [toEnd]),
  );

  // The end of onboarding (ruling 23, #291): the first 3 moves, the paywall, the notification ask. It goes first; the
  // save offer waits for it (10-onboarding.md §9.1).
  useFinishSequence();
  // "Keep your fits" (A3, #289): the save offer, posted when offer.ts says it's due.
  useAccountOffer();
  useAboutYou();

  // The morning/evening card (02 "S1d"): posted the first time Stylist is shown in its window,
  // including when the app comes back to the front the next morning (focus doesn't fire then).
  useFocusEffect(
    useCallback(() => {
      // …and a card still showing gets a fresher forecast once its own is stale (#338).
      const post = () => void morning.ensureCard().then(() => morning.freshen()).catch(() => {});
      post();
      const sub = AppState.addEventListener('change', (st) => {
        if (st === 'active') post();
      });
      return () => sub.remove();
    }, []),
  );

  // A new check (his photo lands in the thread) or a question he sent always brings the thread down to it, even if
  // he'd scrolled up to an older card: from here it follows the reading, the score or the answer as they grow.
  // The first load only records where things stand; for a photo, the camera cover closes before we scroll.
  const newestMine =
    loaded === undefined
      ? undefined
      : messages.reduce<ChatMessage | null>((a, m) => (m.role === 'user' && (!a || m.createdAt >= a.createdAt) ? m : a), null) ?? null;
  const newestMineId = newestMine === undefined ? undefined : newestMine?.id ?? '';
  const newestMineIsPhoto = newestMine?.kind === 'photo';
  const seenMine = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (newestMineId === undefined) return;
    const before = seenMine.current;
    seenMine.current = newestMineId;
    if (before === undefined || before === newestMineId) return;
    atBottom.current = true;
    follow.set(1);
    const timer = setTimeout(() => toEnd(true), newestMineIsPhoto ? SHEET_DISMISS_MS : 50);
    return () => clearTimeout(timer);
  }, [newestMineId, newestMineIsPhoto, toEnd, follow]);

  // Each row's top, for "scroll to this card" (the morning card's one-line score).
  const rowY = useRef(new Map<string, number>());
  const action = usePendingStylistAction();
  useEffect(() => {
    if (!action) return;
    clearStylistAction();
    if (action.kind === 'checkMyFit') openCamera();
    // You's Re-check (#370): the same camera the card's own Re-check opens.
    if (action.kind === 'recheck') router.push(`/camera?mode=recheck&parent=${action.checkId}`);
    if (action.kind === 'scrollTo') {
      // Only a row today's thread still shows: a stored position can be stale (U11 in 07 §17's list).
      const y = shownIds.has(action.messageId) ? rowY.current.get(action.messageId) : undefined;
      if (y !== undefined) {
        atBottom.current = false;
        follow.set(0);
        list.current?.scrollTo({ y: Math.max(0, y - viewH.current * 0.1), animated: motion });
      } else {
        // On an earlier day: open that day's chat.
        const m = all.find((x) => x.id === action.messageId);
        if (m) router.push(`/stylist/day/${dayKey(m.createdAt, sessionClock.offset)}`);
      }
    }
  }, [action, all, list, follow, shownIds, motion]);

  // The first view must be the ScrollView itself (no wrapper) for the tab bar to shrink on scroll.
  return (
    <>
      <Animated.ScrollView
        ref={list}
        style={{ backgroundColor: colors.bg }}
        contentContainerStyle={styles.thread}
        // Only his own scrolling decides whether the thread follows new messages; cards that
        // finish loading (content growing) keep it pinned to the newest message.
        onScrollBeginDrag={() => {
          dragging.current = true;
          // Focused with no keyboard on screen (a hardware keyboard): scrolling puts the field away.
          if (!Keyboard.isVisible()) Keyboard.dismiss();
        }}
        onScrollEndDrag={onDragEnd}
        onMomentumScrollEnd={onMomentumEnd}
        scrollEventThrottle={16}
        onScroll={onScroll}
        onContentSizeChange={(_w, h) => {
          // Something new below while he's scrolled up: the Latest pill offers the way down (L1).
          if (h > contentH.current && contentH.current > 0 && !atBottom.current) newBelow.current = true;
          contentH.current = h;
          updatePill();
          // Not while his finger is on it (U17: each new sentence used to pull him back down mid-drag), and with
          // VoiceOver on only his own sends move the thread (a three-finger scroll never reads as "scrolled up").
          if (atBottom.current && !dragging.current && !(screenReader.current && !first.current)) toEnd(!first.current);
        }}
        onLayout={(e) => {
          viewH.current = e.nativeEvent.layout.height;
          updatePill();
          toEnd(false);
          first.current = false;
        }}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="never"
      >
        {/* Kit's unseen rows fade in and rise (arrival.ts). No state changes on scroll: a render there broke toasts (#118, #353). */}
        {(seenUntil === undefined ? [] : items).map((item, i, rows) => {
          // A day stamp moves with the row after it, so it doesn't sit alone above a message still fading in.
          const next = item.type === 'stamp' ? rows[i + 1] : item;
          const delay = next?.type === 'msg' ? arrivals.delayOf(next.message.id) : null;
          return (
            <Animated.View
              key={item.key}
              entering={delay === null ? undefined : arrivalEntering(delay, a11y.reduceMotion)}
              style={i > 0 ? { marginTop: item.gap } : undefined}
              onLayout={item.type === 'msg' ? (e) => rowY.current.set(item.message.id, e.nativeEvent.layout.y) : undefined}
            >
              <ThreadRow item={item} followUps={item.type === 'msg' && followUps?.messageId === item.message.id && (!live || live.phase === 'done') ? followUps.taps : undefined}
                enter={item.type === 'msg' && arrivals.cardEnters(item.message.id)}
              />
            </Animated.View>
          );
        })}
        {beat.typing ? (
          <Animated.View entering={arrivalEntering(0, a11y.reduceMotion)} style={items.length > 0 ? { marginTop: liveGap(shown.length ? shown.reduce((a, m) => (m.createdAt >= a.createdAt ? m : a)) : null) } : undefined}>
            <KitTypingRow />
          </Animated.View>
        ) : null}
        {live && showLive ? (
          // Once, when the answer's first row (the dots) appears; not per sentence, and the finished row doesn't repeat it.
          <Animated.View
            entering={arrivalEntering(0, a11y.reduceMotion)}
            style={items.length > 0 ? { marginTop: liveGap(shown.length ? shown.reduce((a, m) => (m.createdAt >= a.createdAt ? m : a)) : null) } : undefined}
          >
            <LiveAnswerRow live={live} />
          </Animated.View>
        ) : null}
        {/* A footer, not paddingBottom: it animates with the dock and the keyboard. */}
        <Animated.View style={footerStyle} />
      </Animated.ScrollView>
      {/* The scroll-edge fade under the header (as Closet's native one): rows soften into the bar
          instead of being cut in half. A sibling after the ScrollView, so the tab bar still shrinks. */}
      <View pointerEvents="none" style={[styles.edgeFade, { experimental_backgroundImage: edgeFade(colors.bg) }]} />
      <OfflineBanner top={space.xs} />
      {/* Steps aside while a toast shows (5–8 s), so the two never stack (#353). */}
      {pill && !toast ? <PillDock base={pillBase} lift={lift} onPress={toLatest} /> : null}
      {docked ? (
        <Animated.View
          style={[styles.dock, dockStyle]}
          pointerEvents="box-none"
          onLayout={(e) => {
            // Toasts sit above the composer here (its top, measured from the screen bottom at rest).
            dockH.value = e.nativeEvent.layout.height;
            dockTop.current = COMPOSER_BOTTOM + e.nativeEvent.layout.height;
            setToastFloor(dockTop.current);
            pillBase.set(dockTop.current + DOCK_GAP);
          }}
        >
          {DOCK_ALWAYS ? <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg, opacity: 0.94 }]} pointerEvents="none" /> : null}
          <Composer
            mode={mode}
            onCamera={openCamera}
            onSend={sendQuestion}
            sendDisabled={askInFlight || !net.online}
            autoFocus={open === 'type'}
            startVoice={open === 'voice'}
            onIdle={DOCK_ALWAYS ? undefined : composerState.close}
            chips={chips}
          />
        </Animated.View>
      ) : null}
    </>
  );
}

/**
 * The Latest pill's spot, riding the keyboard. Its animated style lives only while the pill is on screen: a style kept
 * on the screen with nothing to draw (and reading the toast's room) left every toast's entering animation stuck
 * invisible on iOS (found on the Simulator, #353; the same symptom as #118).
 */
function PillDock({ base, lift, onPress }: { base: SharedValue<number>; lift: SharedValue<number>; onPress: () => void }) {
  const style = useAnimatedStyle(() => ({ bottom: base.value + lift.value }));
  return (
    <Animated.View pointerEvents="box-none" style={[styles.pill, style]}>
      <LatestPill onPress={onPress} />
    </Animated.View>
  );
}

/** VoiceOver on, as a ref (read inside scroll callbacks). */
function useScreenReaderRef() {
  const on = useRef(false);
  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isScreenReaderEnabled?.().then((v) => {
      if (alive) on.current = v;
    });
    const sub = AccessibilityInfo.addEventListener?.('screenReaderChanged', (v: boolean) => {
      on.current = v;
    });
    return () => {
      alive = false;
      sub?.remove();
    };
  }, []);
  return on;
}

/** Height of the soft edge under the Stylist header (the thread's top padding matches it, so the
 *  first row isn't faded when the thread is scrolled all the way up). */
const EDGE_FADE = space.xl;

/** bg → clear, top to bottom. `bg` is a #RRGGBB token. */
function edgeFade(bg: string): string {
  const n = parseInt(bg.slice(1, 7), 16);
  const rgb = `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
  return `linear-gradient(180deg, rgba(${rgb}, 1) 0%, rgba(${rgb}, 0.85) 35%, rgba(${rgb}, 0) 100%)`;
}

const styles = StyleSheet.create({
  thread: { flexGrow: 1, justifyContent: 'flex-end', paddingHorizontal: space.gutter, paddingTop: EDGE_FADE },
  edgeFade: { position: 'absolute', top: 0, left: 0, right: 0, height: EDGE_FADE },
  dock: { position: 'absolute', left: 0, right: 0, paddingBottom: 0 },
  pill: { position: 'absolute', left: 0, right: 0, height: 44 },
});

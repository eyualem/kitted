// Kit types before it speaks (arrival.ts BEAT; SY2.12–SY2.18): holds the hello (or the post-first-score line) and its
// cards back while the dots show, then lets the line land, then the card a beat later (one soft tap after the hello
// only). Rows it holds are left out of the thread, so the thread's own arrival (fade and rise, fades only with Reduce
// Motion) plays when they come back. Plays once per lead line, and only for rows he hasn't seen (arrival.ts).
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import type { ChatMessage } from '@/data/types';
import { t } from '@/i18n/en';
import { arrivals, BEAT, beatFollowers, type Beat } from './arrival';

const NONE: ReadonlySet<string> = new Set();

/** What VoiceOver reads once the dots are gone (the stored hello draws from the string, not from stored text). */
const lineOf = (beat: Beat): string => (beat.kind === 'hello' ? t('stylist.aiNote') : t('plan.intro'));

export function useTypingBeat(rows: readonly ChatMessage[], seenUntil: number | undefined, focused: boolean) {
  const [run, setRun] = useState<{ beat: Beat; stage: 'typing' | 'lead' } | null>(null);
  // The same render that finds a beat already holds its rows: a row that mounts first would never get its entrance.
  const found = run === null && seenUntil !== undefined && focused ? arrivals.findBeat(rows, seenUntil) : null;
  const beat = run?.beat ?? found;
  const stage = run?.stage ?? 'typing';

  // Started while drawing (React re-renders at once, before the rows mount): `found` is gone by then, `run` holds the beat.
  // Nothing outside React changes here (a strict double render finds the same beat twice); the effect below marks it begun.
  if (found) setRun({ beat: found, stage: 'typing' });

  // How many cards trail the lead right now (read when the dots end: a card written during them still gets its beat).
  const trailing = useRef(0);
  const running = run?.beat ?? null;
  useEffect(() => {
    if (!running) return;
    arrivals.beatBegan(running.leadId);
    AccessibilityInfo.announceForAccessibility?.(t('ask.a11yWriting'));
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(
      setTimeout(() => {
        AccessibilityInfo.announceForAccessibility?.(lineOf(running));
        if (trailing.current === 0) {
          setRun(null);
          return;
        }
        setRun({ beat: running, stage: 'lead' });
        timers.push(
          setTimeout(() => {
            // The one soft tap, with the offer card after setup only (not the general answer, not the moves card).
            if (running.kind === 'hello') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
            setRun(null);
          }, BEAT.cardGapMs),
        );
      }, BEAT.typingMs),
    );
    return () => timers.forEach(clearTimeout);
  }, [running]);

  const held = useMemo<ReadonlySet<string>>(() => {
    if (!beat) return NONE;
    // The cards are asked for again on every change of the rows: a card written a moment after the lead is held too.
    const lead = rows.find((m) => m.id === beat.leadId);
    const followers = lead ? beatFollowers(beat.kind, lead, rows) : beat.followerIds;
    return new Set(stage === 'typing' ? [beat.leadId, ...followers] : followers);
  }, [beat, stage, rows]);
  useEffect(() => {
    trailing.current = beat ? [...held].filter((id) => id !== beat.leadId).length : 0;
  }, [held, beat]);
  return { held, typing: beat !== null && stage === 'typing' };
}

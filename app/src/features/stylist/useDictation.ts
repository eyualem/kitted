// The composer's mic (DECISIONS-LOG #70; round 2 #302): tap to start; it stops on a tap, after a pause once he's
// talked, or after a minute, and the words land in the field (onHeard). ✕ throws them away. Never sends by itself.
// On-device (kitted-vision → SpeechAnalyzer). The logic lives in dictation.ts (tested); this wraps it for React.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking } from 'react-native';
import { useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { dictationAvailable, dictationSupported, onDictation, prepareDictation, requestMicrophone, startDictation, stopDictation } from '../../../modules/kitted-vision';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import { chipPieces } from '@/features/ask/answerText';
import { micLog } from '@/features/camera/devLog';
import { showToast } from '@/features/toast/toast';
import { t } from '@/i18n/en';
import { createDictationController, type DictationController, type DictationState } from './dictation';

export type { DictationState } from './dictation';

export interface Dictation {
  available: boolean;
  state: DictationState;
  /** Live words while listening (in-progress words included). */
  text: string;
  /** 0…1 loudness for the waveform. */
  level: SharedValue<number>;
  start: () => Promise<void>;
  /** Stops; the words go to onHeard (and are returned). */
  stop: () => Promise<string>;
  cancel: () => Promise<void>;
}

export function useDictation(onHeard: (text: string) => void): Dictation {
  const [state, setState] = useState<DictationState>('idle');
  const [text, setText] = useState('');
  const level = useSharedValue(0);
  const heardRef = useRef(onHeard);
  const closet = useLive(['closet'], () => store.closet.all(), []);
  const names = useRef<string[]>([]);
  const ctl = useRef<DictationController | null>(null);
  useEffect(() => {
    heardRef.current = onHeard;
  }, [onHeard]);
  useEffect(() => {
    names.current = closet ? chipPieces(closet).map((p) => p.name) : [];
  }, [closet]);

  // The mic shows only where dictation runs on the phone (checked once; false on the Simulator).
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    let live = true;
    if (dictationAvailable) {
      void dictationSupported().then((ok) => {
        if (!live) return;
        setSupported(ok);
        // Install the speech model now, not on his first tap (#302).
        if (ok) void prepareDictation().then((r) => micLog(`prepare · ${r}`));
      });
    }
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    const c = createDictationController({
      native: { requestMicrophone, prepare: prepareDictation, start: startDictation, stop: stopDictation, onEvent: onDictation },
      now: () => Date.now(),
      setTimer: (fn, ms) => setTimeout(fn, ms),
      clearTimer: (id) => clearTimeout(id as ReturnType<typeof setTimeout>),
      words: () => names.current,
      onHeard: (h) => heardRef.current(h),
      onToast: (key) => showToast(t(key)),
      onMicOff: () =>
        Alert.alert(t('mic.off.title'), t('mic.off.body'), [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('mic.off.settings'), isPreferred: true, onPress: () => void Linking.openSettings() },
        ]),
      log: micLog,
    });
    ctl.current = c;
    const off = c.subscribe((s) => {
      setState(s.state);
      setText(s.text);
      level.set(withTiming(s.state === 'listening' ? s.level : 0, { duration: s.state === 'listening' ? 90 : 150 }));
    });
    return () => {
      off();
      c.dispose();
      ctl.current = null;
    };
  }, [level]);

  const start = useCallback(async () => ctl.current?.start(), []);
  const stop = useCallback(async () => (ctl.current ? ctl.current.stop() : ''), []);
  const cancel = useCallback(async () => ctl.current?.cancel(), []);
  return { available: supported, state, text, level, start, stop, cancel };
}

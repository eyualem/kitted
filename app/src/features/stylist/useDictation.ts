// The composer's mic (DECISIONS-LOG #70): tap to start, tap stop to drop the words into the field,
// ✕ to throw them away. Never sends by itself. On-device (kitted-vision → SpeechAnalyzer).
import { useEffect, useRef, useState } from 'react';
import { Alert, Linking } from 'react-native';
import { useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { dictationAvailable, dictationSupported, onDictation, requestMicrophone, startDictation, stopDictation } from '../../../modules/kitted-vision';
import { showToast } from '@/features/toast/toast';
import { t } from '@/i18n/en';

/** He can't talk forever into a chat box; stop after a minute. */
const MAX_MS = 60_000;

export type DictationState = 'idle' | 'starting' | 'listening';

export interface Dictation {
  available: boolean;
  state: DictationState;
  /** Live words while listening (in-progress words included). */
  text: string;
  /** 0…1 loudness for the waveform. */
  level: SharedValue<number>;
  start: () => Promise<void>;
  /** Stops and returns everything heard (the caller puts it in the field). */
  stop: () => Promise<string>;
  cancel: () => Promise<void>;
}

export function useDictation(): Dictation {
  const [state, setState] = useState<DictationState>('idle');
  const [text, setText] = useState('');
  const textRef = useRef('');
  const level = useSharedValue(0);
  const cap = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The mic shows only where dictation runs on the phone (checked once; false on the Simulator).
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    let live = true;
    if (dictationAvailable) void dictationSupported().then((ok) => live && setSupported(ok));
    return () => {
      live = false;
    };
  }, []);

  useEffect(
    () =>
      onDictation((e) => {
        if (e.type === 'text') {
          textRef.current = e.text;
          setText(e.text);
        } else if (e.type === 'level') {
          level.set(withTiming(e.level, { duration: 90 }));
        } else {
          setState('idle');
          level.set(withTiming(0, { duration: 150 }));
          if (e.error) {
            if (__DEV__) console.log('[mic] ended with error:', e.error);
            showToast(t('mic.error'));
          }
        }
      }),
    [level],
  );

  useEffect(() => () => void stopDictation(), []);

  const clearCap = () => {
    if (cap.current) clearTimeout(cap.current);
    cap.current = null;
  };

  const stop = async (): Promise<string> => {
    clearCap();
    await stopDictation();
    setState('idle');
    const heard = textRef.current.trim();
    textRef.current = '';
    setText('');
    return heard;
  };

  const start = async () => {
    if (state !== 'idle') return;
    if ((await requestMicrophone()) !== 'granted') {
      Alert.alert(t('mic.off.title'), t('mic.off.body'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('mic.off.settings'), isPreferred: true, onPress: () => void Linking.openSettings() },
      ]);
      return;
    }
    textRef.current = '';
    setText('');
    setState('starting');
    try {
      await startDictation();
      setState('listening');
      cap.current = setTimeout(() => void stop(), MAX_MS);
    } catch (e) {
      if (__DEV__) console.log('[mic] start failed:', e instanceof Error ? e.message : String(e));
      setState('idle');
      showToast(t('mic.error'));
    }
  };

  const cancel = async () => {
    await stop();
  };

  return { available: supported, state, text, level, start, stop, cancel };
}

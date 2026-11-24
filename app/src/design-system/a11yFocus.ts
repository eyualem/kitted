// Moving VoiceOver's focus to a view, for the places that hand it on after a change (a card leaving, a row removed).
// iOS only: react-native-web's findNodeHandle throws ("not supported on web"), which crashed the web demo's style game
// on its first card, and the web build has no VoiceOver focus to move anyway. So on the web this does nothing.
import { AccessibilityInfo, findNodeHandle, Platform } from 'react-native';

type FocusTarget = Parameters<typeof findNodeHandle>[0] | undefined;

export function focusForVoiceOver(node: FocusTarget): void {
  if (Platform.OS === 'web' || node == null) return;
  const tag = findNodeHandle(node);
  if (tag != null) AccessibilityInfo.setAccessibilityFocus(tag);
}

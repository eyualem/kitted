// Onboarding: its own stack behind the onboarding guard. No tab bar (the tabs aren't mounted
// yet) and Back, not X (02 §1.2). The steps draw their own Back control (P4).
// T113: the style game (Looks) turns the edge swipe off: a Me swipe that starts near the left edge would pop the screen,
// and the Back circle undoes one step at a time (technical default 6). Add a look is a form sheet in this stack.
import { Stack } from 'expo-router';
import { useTheme } from '@/design-system';

export default function OnboardingStack() {
  const { isAccessibilitySize } = useTheme();
  return (
    <Stack initialRouteName="welcome" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="looks" options={{ gestureEnabled: false }} />
      <Stack.Screen
        name="add-look"
        options={{ presentation: 'formSheet', sheetGrabberVisible: true, sheetAllowedDetents: isAccessibilitySize ? [1] : [0.75, 1] }}
      />
    </Stack>
  );
}

// focusForVoiceOver: moves VoiceOver focus on iOS; on the web it must never call findNodeHandle, which throws there
// (the web demo's style game crashed on it, Nov 24).

function load(os: 'ios' | 'web') {
  const findNodeHandle = jest.fn((r: unknown) => {
    if (os === 'web') throw new Error('findNodeHandle is not supported on web.');
    return r === null ? null : 42;
  });
  const setAccessibilityFocus = jest.fn();
  jest.doMock('react-native', () => ({ Platform: { OS: os }, findNodeHandle, AccessibilityInfo: { setAccessibilityFocus } }));
  let focus!: typeof import('@/design-system/a11yFocus').focusForVoiceOver;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    focus = require('@/design-system/a11yFocus').focusForVoiceOver;
  });
  return { focus, findNodeHandle, setAccessibilityFocus };
}

afterEach(() => {
  jest.dontMock('react-native');
  jest.resetModules();
});

it('on iOS, focuses the view the node points to', () => {
  const { focus, setAccessibilityFocus } = load('ios');
  focus({} as never);
  expect(setAccessibilityFocus).toHaveBeenCalledWith(42);
});

it('on iOS, does nothing without a node', () => {
  const { focus, findNodeHandle, setAccessibilityFocus } = load('ios');
  focus(null);
  focus(undefined);
  expect(findNodeHandle).not.toHaveBeenCalled();
  expect(setAccessibilityFocus).not.toHaveBeenCalled();
});

it('on the web, does nothing and does not throw', () => {
  const { focus, findNodeHandle, setAccessibilityFocus } = load('web');
  expect(() => focus({} as never)).not.toThrow();
  expect(findNodeHandle).not.toHaveBeenCalled();
  expect(setAccessibilityFocus).not.toHaveBeenCalled();
});

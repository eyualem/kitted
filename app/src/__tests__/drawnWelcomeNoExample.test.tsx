// T38 · Welcome and the Example check when there is no example (tasks/T38/TESTING.md OS1.1 "engine null", OS2.1 edges).
// The bundled reading is taken away for this file only (demoReadingById('s14') → null), so welcomeExample() and
// exampleCheck() are null however and whenever the screens read them. It can't happen with the bundled reading; the
// screens must still show no photo and their buttons must still work.
import { advance, allTexts, byId, expectNoPhoto, mockT38, mount, press, textAt, setUpT38Tests } from '@/testing/t38ScreenMocks';
import { screen, within } from '@testing-library/react-native';
import { router } from 'expo-router';
import { ExampleCheckScreen } from '@/features/onboarding/ExampleCheckScreen';
import { exampleCheck } from '@/features/onboarding/exampleCheck';
import { welcomeExample } from '@/features/onboarding/welcomeExample';
import { WelcomeScreen } from '@/features/onboarding/WelcomeScreen';

jest.mock('@/services/readingSource/demoReadings', () => {
  const actual = jest.requireActual('@/services/readingSource/demoReadings');
  return { ...actual, demoReadingById: (id: string) => (id === 's14' ? null : actual.demoReadingById(id)) };
});

const life = setUpT38Tests();
const TITLE = 'Look put together.\nWithout trying\ntoo hard.';
const BODY = 'Send a fit. Get a score out of 10 and the two or three moves that raise it.';
const INTRO = "Here's an example check. This is what you'll get.";
const NOTE = 'A drawn example, scored by the same code as your photos. Nothing was sent.';

it('OS1.1 · with no example (engine null) Welcome still shows no photo and its buttons work', async () => {
  expect(welcomeExample()).toBeNull();
  expect(exampleCheck()).toBeNull();
  for (const theme of [{ ax: false }, { ax: true }]) {
    mockT38.theme = { ...mockT38.theme, isAccessibilitySize: theme.ax };
    const r = await mount(<WelcomeScreen />);
    expect(byId('welcome-drawing')).toBeNull();
    expect(byId('welcome-card')).toBeNull();
    expect(byId('drawn-piece-shoes')).toBeNull();
    expectNoPhoto();
    const texts = allTexts();
    expect(texts.filter((x) => x === TITLE)).toHaveLength(1);
    expect(texts.filter((x) => x === BODY)).toHaveLength(1);
    expect(texts.filter((x) => /7\.5|8\.0|Put together|Sharp/.test(x))).toEqual([]);
    await advance(3000);
    expectNoPhoto();
    await r.unmount();
  }
  mockT38.theme = { ...mockT38.theme, isAccessibilitySize: false };
  await mount(<WelcomeScreen />);
  await press(screen.getByText('See an example check'));
  expect(router.push).toHaveBeenLastCalledWith('/onboarding/example');
  expect(life.watch.writes).toEqual([]);
  await press(screen.getByText('Get started'));
  expect(await mockT38.store.getKv('onboarding.step')).toBe('looks');
  expect(router.push).toHaveBeenLastCalledWith('/onboarding/looks');
  expect(router.push).toHaveBeenCalledTimes(2);
  expect(life.watch.writes).toEqual(['kv:onboarding.step=looks']);
});

it('OS2.1 · with no example the Example check shows the intro and the caption only', async () => {
  const r = await mount(<ExampleCheckScreen />);
  expect(screen.getAllByText(INTRO)).toHaveLength(1);
  expect(textAt('example-note')).toBe(NOTE);
  expect(byId('example-bubble')).toBeNull();
  expect(byId('example-card')).toBeNull();
  expect(byId('example-math')).toBeNull();
  expect(screen.queryAllByTestId('garment-art')).toHaveLength(0);
  expectNoPhoto();
  await press(within(screen.getByTestId('example-dock')).getByText('Get started'));
  expect(router.push).toHaveBeenCalledWith('/onboarding/looks');
  await r.unmount();
  await mount(<ExampleCheckScreen mode="sheet" />);
  expect(screen.getAllByText(INTRO)).toHaveLength(1);
  expect(byId('example-bubble')).toBeNull();
  expect(within(screen.getByTestId('example-dock')).getAllByText('Check my own fit')).toHaveLength(1);
  expectNoPhoto();
});

// T39 · Style profile's Name and Age rows, rendered (specs/onboarding-screens.md OS4.6, specs/you-and-first-run.md
// SY4.2; tasks/T39/TESTING.md): the Basics card in order (Name, Fit you like, Age), the Age row read-only with the band
// (from the birth year on an older profile), the new footnote, and the name saved by the same rule as About you, with
// nothing else in the profile moving. The shared T39 mocks (src/testing/t39ScreenMocks.tsx); Done is the header's
// button, and leaving fires the navigator's beforeRemove.
//
// Profile (CLAUDE.md rule 6): no photo is used here. The bands are what he picked (22–25) or the one his own birth year
// gives (2005 → 18–21 on the 2026 clock); never estimated.
import { flush, getId, idsInOrder, mockT39, mount, press, setUpT39Tests, T0, textAt, textOf, typeIn, allNodes, everyString } from '@/testing/t39ScreenMocks';
import { act, screen } from '@testing-library/react-native';
import type { ProfileRow } from '@/data/types';
import StyleProfileScreen from '@/app/(tabs)/you/profile';

setUpT39Tests();

const BAND_AT = T0 - 86_400_000;

function profileRow(o: Partial<ProfileRow> = {}): ProfileRow {
  return {
    id: 'me', birthYear: null, heightCm: null, build: '', fitPreference: 'regular', styles: [['streetwear', 0.6], ['workwear', 0.4]] as never, boldness: null,
    budget: null, lastOccasion: 'everyday', consentVersion: '2', consentAt: T0 - 1000, onboardingDone: true, ideaTime: null, units: 'imperial', createdAt: T0 - 5000,
    ageBand: '22-25', ageBandAt: BAND_AT, name: 'Alex', ...o,
  };
}
const stored = async () => (await mockT39.store.profile.get('me')) as ProfileRow | null;
const fixed = (p: ProfileRow | null) => p && { ageBand: p.ageBand, ageBandAt: p.ageBandAt, birthYear: p.birthYear, consentVersion: p.consentVersion, consentAt: p.consentAt };
async function leave() {
  await act(async () => {
    for (const l of mockT39.listeners.beforeRemove ?? []) l({ data: {} });
  });
  await flush();
}
const done = () => screen.getByLabelText('Done');

// ── OS4.6 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
describe('OS4.6 · Style profile shows Name and Age', () => {
  it('OS4.6 · Name, Fit you like, Age, and the footnote', async () => {
    await mockT39.store.profile.put(profileRow());
    await mount(<StyleProfileScreen />);
    const ids = idsInOrder();
    const fitAt = allNodes().findIndex((n) => n.type === 'Text' && textOf(n) === 'Fit you like');
    const nameAt = allNodes().findIndex((n) => n.props.testID === 'profile-name-row');
    const ageAt = allNodes().findIndex((n) => n.props.testID === 'profile-age-row');
    expect([nameAt >= 0, fitAt > nameAt, ageAt > fitAt]).toEqual([true, true, true]);
    expect(ids.indexOf('profile-basics-note')).toBeGreaterThan(ids.indexOf('profile-age-row'));

    const input = getId('profile-name-input');
    expect({ value: input.props.value, placeholder: input.props.placeholder, label: input.props.accessibilityLabel, maxLength: input.props.maxLength })
      .toEqual({ value: 'Alex', placeholder: 'First name (optional)', label: 'Name', maxLength: 30 });
    expect(textAt('profile-age-value')).toBe('22–25');
    const age = getId('profile-age-row');
    expect([age.props.accessible, age.props.accessibilityLabel]).toEqual([true, 'Age, 22–25']);
    expect(textAt('profile-basics-note')).toBe("Age can't be changed here.");
    expect(everyString().filter((x) => /Birth year/.test(x))).toEqual([]);
    // The Age row does nothing on a tap.
    expect([age.props.onPress, age.props.accessibilityRole === 'button']).toEqual([undefined, false]);
    expect(age.queryAll((n) => typeof n.props.onPress === 'function' || n.props.accessibilityRole === 'button')).toEqual([]);
  });

  it('OS4.6 · an older profile shows the band from its birth year', async () => {
    await mockT39.store.profile.put(profileRow({ birthYear: 2005, ageBand: undefined, ageBandAt: undefined, name: undefined }));
    let r = await mount(<StyleProfileScreen />);
    expect(textAt('profile-age-value')).toBe('18–21');
    expect(getId('profile-age-row').props.accessibilityLabel).toBe('Age, 18–21');
    expect(getId('profile-name-input').props.value ?? '').toBe('');
    expect(getId('profile-name-input').props.placeholder).toBe('First name (optional)');
    await r.unmount();

    // A set band wins over a birth year.
    await mockT39.store.wipe();
    await mockT39.store.profile.put(profileRow({ birthYear: 2005, ageBand: '31+' }));
    r = await mount(<StyleProfileScreen />);
    expect(textAt('profile-age-value')).toBe('31 or older');
    await r.unmount();

    // No profile stored: Not set.
    await mockT39.store.wipe();
    r = await mount(<StyleProfileScreen />);
    expect(textAt('profile-age-value')).toBe('Not set');
    expect(getId('profile-age-row').props.accessibilityLabel).toBe('Age, Not set');
    await r.unmount();
  });

  it('OS4.6 · the Name row changes and clears the name; nothing else moves', async () => {
    await mockT39.store.profile.put(profileRow());
    const before = fixed(await stored());
    let r = await mount(<StyleProfileScreen />);
    await typeIn(getId('profile-name-input'), '  Sam ');
    await press(done());
    expect((await stored())?.name).toBe('Sam');
    expect(fixed(await stored())).toEqual(before);
    await r.unmount();

    r = await mount(<StyleProfileScreen />);
    expect(getId('profile-name-input').props.value).toBe('Sam');
    await typeIn(getId('profile-name-input'), '');
    await leave();
    expect((await stored())?.name).toBeNull();
    expect(fixed(await stored())).toEqual(before);
    await r.unmount();
  });
});

// ── SY4.2 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
describe('SY4.2 · the same name rule in Style profile', () => {
  it('SY4.2 · Style profile saves the name by the same rule', async () => {
    const cases: [string, string | null][] = [['   ', null], ['  Sam ', 'Sam'], ['E'.repeat(40), 'E'.repeat(30)], ['Mary Ann', 'Mary Ann']];
    for (const [typed, want] of cases) {
      await mockT39.store.wipe();
      await mockT39.store.profile.put(profileRow({ name: 'Alex' }));
      const before = fixed(await stored());
      const r = await mount(<StyleProfileScreen />);
      await typeIn(getId('profile-name-input'), typed);
      await press(done());
      expect([typed, (await stored())?.name]).toEqual([typed, want]);
      expect(fixed(await stored())).toEqual(before);
      await r.unmount();
    }
  });
});

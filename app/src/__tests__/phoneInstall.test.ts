// tools/phone/install.sh opens the app the way a tester meets it: a fresh install plays setup.
// It used to launch with -skipOnboarding true, which marked setup done on every install, so the
// founder's phone could never reach the style game (DECISIONS-LOG #528).
import { readFileSync } from 'fs';
import { join } from 'path';

const script = readFileSync(join(__dirname, '../../../tools/phone/install.sh'), 'utf8');

describe('phone install script', () => {
  it('launches without skipping setup', () => {
    const launch = script.split('\n').filter((l) => l.includes('com.trykitted.kitted') && !l.trim().startsWith('#'));
    expect(launch.length).toBeGreaterThan(0);
    for (const line of launch) expect(line).not.toMatch(/skipOnboarding/);
  });

  it('opens Metro over the USB cable before trying Wi-Fi (DECISIONS-LOG #529)', () => {
    const cable = script.indexOf('169.254.');
    const wifi = script.indexOf('ipconfig getifaddr en0');
    expect(cable).toBeGreaterThan(-1);
    expect(wifi).toBeGreaterThan(cable);
  });

  it('--standalone builds Release and opens it without Metro (DECISIONS-LOG #530)', () => {
    expect(script).toMatch(/== --standalone \]\] && \{ CONFIG=Release;/);
    const release = script.slice(script.indexOf('if [[ $CONFIG == Release ]]'), script.indexOf('exit 0'));
    expect(release).toMatch(/process launch/);
    expect(release).not.toMatch(/payload-url/);
  });
});

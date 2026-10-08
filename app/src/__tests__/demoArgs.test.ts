import { defaultDemoArgs, parseArgs, queryToRaw, resolveDemoArgs } from '@/demo/demoArgs';

describe('demoArgs', () => {
  it('uses the defaults with no sources', () => {
    expect(resolveDemoArgs({})).toEqual(defaultDemoArgs);
    expect(defaultDemoArgs.latency).toBe(6.6);
  });

  it('parses a deep-link query', () => {
    const raw = queryToRaw('?now=2026-10-22T21:12:00&freeChecksUsed=1&latency=0&theme=dark&frame=1');
    expect(parseArgs(raw)).toEqual({ now: '2026-10-22T21:12:00', freeChecksUsed: 1, latency: 0, theme: 'dark', frame: true });
  });

  it('reads launch-argument names and UserDefaults value types', () => {
    expect(parseArgs({ demoScreen: 7, demoLatency: '0', resetData: 1, demoNow: 'real' })).toEqual({
      demoScreen: 7,
      latency: 0,
      resetData: true,
      now: 'real',
    });
  });

  it('ranks deep link over launch argument over build default', () => {
    const args = resolveDemoArgs({ deepLink: { latency: '1' }, launch: { demoLatency: '2', pro: '1' }, build: { latency: 3, uiTesting: true } });
    expect(args.latency).toBe(1);
    expect(args.pro).toBe(true);
    expect(args.uiTesting).toBe(true);
  });

  it('seed=full implies skipOnboarding', () => {
    expect(resolveDemoArgs({ launch: { seed: 'full' } }).skipOnboarding).toBe(true);
    expect(resolveDemoArgs({ launch: { seed: 'empty' } }).skipOnboarding).toBe(false);
  });

  it('ignores invalid values instead of throwing', () => {
    expect(parseArgs({ demoScreen: '99', theme: 'blue', latency: '-1', now: 'tomorrow', seed: 'half', unknown: 'x' })).toEqual({});
  });

  it('treats a bare flag as true', () => {
    expect(parseArgs(queryToRaw('uiTesting&pro=0'))).toEqual({ uiTesting: true, pro: false });
  });
});

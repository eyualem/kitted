// Ready for the Apple approval day (handoff/09-ui-review.md §27, #366): the build profiles, the Firebase key guard, the
// privacy manifest, the paid-team switch, WeatherKit with NWS behind it, the StoreKit file, and the built-app check.
import coldRain from './fixtures/nws/hourly-cold-rain.json';
import evening from './fixtures/nws/hourly-evening.json';
import type { WeatherKitHour } from '../../modules/kitted-location';
import { applePaidFrom } from '@/config/apple';
import { PRO_MONTHLY } from '@/services/purchases';
import { weatherKitFirst } from '@/services/weather';
import { isLiveWeather, isNwsWeather, isWeatherKitWeather, mapHourly, type LocationProvider, type NwsPeriod, type NwsSource, type SourcedWeather } from '@/services/weather/nws';
import { conditionWords, createWeatherKitSource, toPeriods } from '@/services/weather/weatherkit';

declare const __dirname: string;
declare const require: (id: string) => unknown;
const { readFileSync } = jest.requireActual<{ readFileSync(p: string, enc: 'utf8'): string }>('fs');
const { join } = jest.requireActual<{ join(...p: string[]): string }>('path');
const APP = join(__dirname, '..', '..');
const read = (p: string) => readFileSync(join(APP, p), 'utf8');

type Config = {
  ios: { appleTeamId: string; entitlements: Record<string, unknown>; infoPlist: Record<string, unknown>; privacyManifests: Record<string, unknown> };
  plugins: unknown[];
  extra: { demo: unknown; applePaid: unknown };
};
type ConfigModule = {
  default: Config;
  appleSettings: (a: { paid: boolean; teamId: string }, profile: string | undefined) => { teamId: string; entitlements: Record<string, unknown>; locationUsage: string; applePaid: boolean };
  requireFirebaseKey: (profile: string | undefined, key: string | undefined) => void;
};

/** app.config.ts evaluated with these env vars (restored after). */
function loadConfig(env: Record<string, string | undefined> = {}): ConfigModule {
  const before: Record<string, string | undefined> = {};
  for (const k of Object.keys(env)) {
    before[k] = process.env[k];
    if (env[k] === undefined) delete process.env[k];
    else process.env[k] = env[k];
  }
  try {
    let out: ConfigModule | undefined;
    jest.isolateModules(() => {
      out = require('../../app.config') as ConfigModule;
    });
    return out!;
  } finally {
    for (const k of Object.keys(env)) {
      if (before[k] === undefined) delete process.env[k];
      else process.env[k] = before[k];
    }
  }
}

describe('A · build profiles', () => {
  const eas = JSON.parse(read('eas.json')) as { cli: Record<string, unknown>; build: Record<string, Record<string, unknown>> };

  it('A1 development, preview and production, each with its EAS environment; no key values, no KITTED_DEMO', () => {
    expect(eas.build.development).toMatchObject({ environment: 'development', developmentClient: true, distribution: 'internal' });
    expect(eas.build.preview).toMatchObject({ environment: 'preview', distribution: 'internal', ios: { buildConfiguration: 'Release' } });
    expect(eas.build.production).toMatchObject({ environment: 'production', distribution: 'store', autoIncrement: true, ios: { buildConfiguration: 'Release' } });
    expect(eas.cli.appVersionSource).toBe('remote');
    const text = read('eas.json');
    expect(text).not.toMatch(/AIza|sk-|EXPO_PUBLIC_|KITTED_DEMO/);
  });

  it('A2 a preview or production EAS build needs EXPO_PUBLIC_FIREBASE_API_KEY; local and development runs don\'t', () => {
    const { requireFirebaseKey } = loadConfig();
    expect(() => requireFirebaseKey('production', undefined)).toThrow(/EXPO_PUBLIC_FIREBASE_API_KEY/);
    expect(() => requireFirebaseKey('preview', '')).toThrow(/EXPO_PUBLIC_FIREBASE_API_KEY/);
    expect(() => requireFirebaseKey('production', 'a-key')).not.toThrow();
    expect(() => requireFirebaseKey('development', undefined)).not.toThrow();
    expect(() => requireFirebaseKey(undefined, undefined)).not.toThrow();
    // And the config itself applies it.
    expect(() => loadConfig({ EAS_BUILD_PROFILE: 'production', EXPO_PUBLIC_FIREBASE_API_KEY: undefined })).toThrow(/production/);
    expect(() => loadConfig({ EAS_BUILD_PROFILE: 'production', EXPO_PUBLIC_FIREBASE_API_KEY: 'x'.repeat(39) })).not.toThrow();
  });

  it('A3 check:app refuses the dev launcher\'s keys, a short manifest and stray entitlements', () => {
    const { checkApp, PAID_ENTITLEMENTS } = require('../../scripts/check-release-app.js') as {
      checkApp: (a: { info: Record<string, unknown>; privacy: Record<string, unknown> | null; entitlements: Record<string, unknown>; paid: boolean }) => string[];
      PAID_ENTITLEMENTS: string[];
    };
    const privacy = loadConfig().default.ios.privacyManifests;
    const clean = { info: { CFBundleName: 'Kitted' }, privacy, entitlements: {}, paid: false };
    expect(checkApp(clean)).toEqual([]);
    expect(checkApp({ ...clean, info: { NSBonjourServices: ['_expo._tcp'], NSLocalNetworkUsageDescription: 'Expo Dev Launcher uses the local network…', EXDevMenuIsOnboardingFinished: true } })).toHaveLength(3);
    expect(checkApp({ ...clean, privacy: null })).toEqual(['no PrivacyInfo.xcprivacy in the app']);
    expect(checkApp({ ...clean, privacy: { NSPrivacyTracking: false, NSPrivacyAccessedAPITypes: [], NSPrivacyCollectedDataTypes: [] } }).length).toBe(5);
    const paidEnt = Object.fromEntries(PAID_ENTITLEMENTS.map((k) => [k, true]));
    expect(checkApp({ ...clean, entitlements: paidEnt })).toHaveLength(4);
    expect(checkApp({ ...clean, entitlements: paidEnt, paid: true })).toEqual([]);
    expect(checkApp({ ...clean, paid: true })).toHaveLength(4);
    expect((JSON.parse(read('package.json')) as { scripts: Record<string, string> }).scripts['check:app']).toBe('node scripts/check-release-app.js');
  });
});

describe('P · the privacy manifest', () => {
  const pm = loadConfig().default.ios.privacyManifests as {
    NSPrivacyTracking: boolean;
    NSPrivacyTrackingDomains: string[];
    NSPrivacyAccessedAPITypes: { NSPrivacyAccessedAPIType: string; NSPrivacyAccessedAPITypeReasons: string[] }[];
    NSPrivacyCollectedDataTypes: { NSPrivacyCollectedDataType: string; NSPrivacyCollectedDataTypeLinked: boolean; NSPrivacyCollectedDataTypeTracking: boolean; NSPrivacyCollectedDataTypePurposes: string[] }[];
  };

  it('P1 every required-reason API the app or a pod uses, with its reason; no tracking', () => {
    const reasons = Object.fromEntries(pm.NSPrivacyAccessedAPITypes.map((t) => [t.NSPrivacyAccessedAPIType, t.NSPrivacyAccessedAPITypeReasons]));
    expect(reasons).toEqual({
      NSPrivacyAccessedAPICategoryUserDefaults: ['CA92.1'],
      NSPrivacyAccessedAPICategoryFileTimestamp: ['C617.1'],
      NSPrivacyAccessedAPICategorySystemBootTime: ['35F9.1'],
      NSPrivacyAccessedAPICategoryDiskSpace: ['E174.1'],
    });
    expect(pm.NSPrivacyTracking).toBe(false);
    expect(pm.NSPrivacyTrackingDomains).toEqual([]);
  });

  it('P1 the app\'s own native code uses only what it declares (file dates in its own folders)', () => {
    const swift = ['modules/kitted-vision/ios/KittedPrep.swift', 'modules/kitted-location/ios/KittedLocationModule.swift'].map(read).join('\n');
    expect(swift).not.toMatch(/systemUptime|volumeAvailableCapacity|systemFreeSize|activeInputModes|creationDate\b/);
  });

  it('P2 the collected data matches the nutrition-label draft, all for app functionality, none for tracking', () => {
    const types = pm.NSPrivacyCollectedDataTypes;
    expect(Object.fromEntries(types.map((t) => [t.NSPrivacyCollectedDataType.replace('NSPrivacyCollectedDataType', ''), t.NSPrivacyCollectedDataTypeLinked]))).toEqual({
      PhotosorVideos: false, OtherUserContent: false, UserID: true, ProductInteraction: true, CoarseLocation: false,
    });
    for (const t of types) {
      expect(t.NSPrivacyCollectedDataTypeTracking).toBe(false);
      expect(t.NSPrivacyCollectedDataTypePurposes).toEqual(['NSPrivacyCollectedDataTypePurposeAppFunctionality']);
    }
    const draft = readFileSync(join(APP, '..', 'market', 'app-store-connect.md'), 'utf8');
    for (const label of ['Photos or Videos', 'Other User Content', 'User ID', 'Product Interaction', 'Coarse Location']) expect(draft).toContain(label);
  });
});

describe('S · the paid-team switch', () => {
  it('S1 on since Nov 3: the paid team (the same ID as the free one), the four entitlements, Apple Weather, applePaid true', () => {
    const c = loadConfig({ EAS_BUILD_PROFILE: undefined }).default;
    expect(c.ios.appleTeamId).toBe('6652QVRQAL');
    expect(Object.keys(c.ios.entitlements).sort()).toEqual([
      'com.apple.developer.applesignin',
      'com.apple.developer.declared-age-range',
      'com.apple.developer.devicecheck.appattest-environment',
      'com.apple.developer.weatherkit',
    ]);
    expect(c.ios.infoPlist.NSLocationWhenInUseUsageDescription).toMatch(/only to Apple Weather/);
    expect(c.extra.applePaid).toBe(true);
    expect(read('app.config.ts')).toMatch(/paid: true,/);
  });

  it('S1b off: the free team, no entitlements, NWS in the location string', () => {
    const { appleSettings } = loadConfig();
    const off = appleSettings({ paid: false, teamId: '' }, undefined);
    expect(off.entitlements).toEqual({});
    expect(off.locationUsage).toMatch(/only to the US National Weather Service/);
    expect(off.applePaid).toBe(false);
  });

  it('S2 on: the paid team, the four entitlements (App Attest by profile), Apple Weather in the location string', () => {
    const { appleSettings } = loadConfig();
    expect(() => appleSettings({ paid: true, teamId: '' }, undefined)).toThrow(/teamId/);
    const prod = appleSettings({ paid: true, teamId: 'AB12CD34EF' }, 'production');
    expect(prod.teamId).toBe('AB12CD34EF');
    expect(prod.entitlements).toEqual({
      'com.apple.developer.declared-age-range': true,
      'com.apple.developer.devicecheck.appattest-environment': 'production',
      'com.apple.developer.weatherkit': true,
      'com.apple.developer.applesignin': ['Default'],
    });
    expect(appleSettings({ paid: true, teamId: 'AB12CD34EF' }, 'development').entitlements['com.apple.developer.devicecheck.appattest-environment']).toBe('development');
    expect(prod.locationUsage).toMatch(/Apple Weather/);
    expect(prod.applePaid).toBe(true);
  });

  it('S3 the app reads only extra.applePaid; WeatherKit answers only with the switch on and the native call there', () => {
    expect([applePaidFrom(true), applePaidFrom(false), applePaidFrom(undefined), applePaidFrom('true')]).toEqual([true, false, false, false]);
    expect(weatherKitFirst({ applePaid: false, weatherKitAvailable: true })).toBe(false);
    expect(weatherKitFirst({ applePaid: true, weatherKitAvailable: false })).toBe(false);
    expect(weatherKitFirst({ applePaid: true, weatherKitAvailable: true })).toBe(true);
    expect(read('src/config/apple.ts')).toMatch(/applePaidFrom\(Constants\.expoConfig\?\.extra\?\.applePaid\)/);
  });
});

/** An NWS forecast as WeatherKit would send it (the condition as a WeatherKit name). */
function asWeatherKit(periods: NwsPeriod[]): WeatherKitHour[] {
  return periods.map((p) => ({
    start: p.startTime,
    end: p.endTime,
    tempF: p.temperature,
    precipChance: (p.probabilityOfPrecipitation?.value ?? 0) / 100,
    humidity: p.relativeHumidity?.value == null ? null : p.relativeHumidity.value / 100,
    windMph: Number((p.windSpeed ?? '').match(/\d+/g)?.pop() ?? NaN),
    condition: (p.shortForecast ?? '').split(' ').map((w, i) => (i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase())).join(''),
  }));
}

const P = (doc: { properties: { periods: unknown[] } }) => doc.properties.periods as NwsPeriod[];
const at = (iso: string) => Date.parse(iso);

function fakeLocation(fix: { latitude: number; longitude: number } | null = { latitude: 42.35689, longitude: -71.05923 }, permission: 'granted' | 'denied' = 'granted') {
  const loc: LocationProvider = { permission: async () => permission, requestPermission: async () => permission, currentLocation: async () => fix };
  return loc;
}

function fakeNws() {
  const calls = { forecast: 0, prefetch: 0 };
  const nws: NwsSource = {
    kind: 'live',
    permission: async () => 'granted',
    requestPermission: async () => 'granted',
    forecast: async (window) => {
      calls.forecast += 1;
      return { ...mapHourly(P(coldRain), window, at('2026-10-22T07:30:00-04:00'))! };
    },
    prefetch: async () => {
      calls.prefetch += 1;
    },
  };
  return { nws, calls };
}

describe('W · WeatherKit, with NWS behind it', () => {
  it('W1 the same hours give the same card weather as NWS, tagged weatherkit', () => {
    for (const [doc, window, now] of [[coldRain, 'day', '2026-10-22T07:30:00-04:00'], [coldRain, 'evening', '2026-10-22T07:30:00-04:00'], [evening, 'evening', '2026-10-22T17:20:00-05:00']] as const) {
      const fromNws = mapHourly(P(doc), window, at(now));
      const fromWk = mapHourly(toPeriods(asWeatherKit(P(doc))), window, at(now));
      expect(fromWk).toEqual(fromNws);
    }
    expect([conditionWords('mostlyCloudy'), conditionWords('heavyRain'), conditionWords('hail'), conditionWords('smoky'), conditionWords('')]).toEqual(['mostly cloudy', 'heavy rain', 'rain', 'smoke', '']);
    expect(toPeriods([{ start: 'x', end: 'y', tempF: NaN, precipChance: 0, humidity: null, windMph: null, condition: 'clear' }])).toEqual([]);
  });

  it('W1–W2 answers from WeatherKit with the coordinate rounded to 2 decimals, labelled as Apple\'s', async () => {
    const asked: [number, number][] = [];
    const { nws, calls } = fakeNws();
    const src = createWeatherKitSource({
      location: fakeLocation(),
      weatherKit: { hourly: async (lat, lon) => (asked.push([lat, lon]), asWeatherKit(P(coldRain))) },
      fallback: nws,
      now: () => at('2026-10-22T07:30:00-04:00'),
    });
    const w = await src.forecast('day');
    expect(w).toMatchObject({ nowF: 43, highF: 58, source: 'weatherkit' });
    expect(asked).toEqual([[42.36, -71.06]]);
    expect(calls.forecast).toBe(0);
    expect([isLiveWeather(w), isWeatherKitWeather(w), isNwsWeather(w)]).toEqual([true, true, false]);
  });

  it('W3 every failure falls back to NWS, whose answer is used as is', async () => {
    const cases: { name: string; hourly: () => Promise<WeatherKitHour[] | null>; timeoutMs?: number }[] = [
      { name: 'null (no entitlement or no module)', hourly: async () => null },
      { name: 'empty', hourly: async () => [] },
      { name: 'throws', hourly: async () => Promise.reject(new Error('boom')) },
      { name: 'never answers', hourly: () => new Promise(() => {}), timeoutMs: 20 },
    ];
    for (const c of cases) {
      const { nws, calls } = fakeNws();
      const src = createWeatherKitSource({ location: fakeLocation(), weatherKit: { hourly: c.hourly }, fallback: nws, timeoutMs: c.timeoutMs, now: () => at('2026-10-22T07:30:00-04:00') });
      const w = await src.forecast('day');
      expect([c.name, (w as SourcedWeather | null)?.source ?? null, calls.forecast]).toEqual([c.name, 'nws', 1]);
    }
  });

  it('W4 cached an hour, one request at a time; no permission → NWS (which says no weather), WeatherKit never asked', async () => {
    let now = at('2026-10-22T07:30:00-04:00');
    let n = 0;
    const { nws } = fakeNws();
    const src = createWeatherKitSource({ location: fakeLocation(), weatherKit: { hourly: async () => (n++, asWeatherKit(P(coldRain))) }, fallback: nws, now: () => now });
    await Promise.all([src.forecast('day'), src.forecast('evening'), src.prefetch()]);
    expect(n).toBe(1);
    now += 61 * 60 * 1000;
    await src.forecast('day');
    expect(n).toBe(2);

    let asked = 0;
    const off = fakeNws();
    const denied = createWeatherKitSource({ location: fakeLocation(null, 'denied'), weatherKit: { hourly: async () => (asked++, []) }, fallback: off.nws });
    await denied.prefetch();
    expect(asked).toBe(0);
    expect(off.calls.prefetch).toBe(0);
  });

  it('W5 the card treats both sources as live and shows Apple\'s mark and link only with WeatherKit\'s data', () => {
    const card = read('src/features/morning/MorningCard.tsx');
    expect(card).toMatch(/const sample = !isLiveWeather\(w\)/);
    expect(card).toMatch(/\{apple \? <AppleWeatherMark \/> : null\}/);
    expect(card).toMatch(/t\('wx\.attribution'\)/);
    expect(card).toMatch(/t\('wx\.sources'\)/);
    expect(read('src/i18n/en.ts')).toMatch(/'wx\.apple': 'Weather: Apple Weather'/);
  });
});

describe('K · StoreKit configuration', () => {
  const sk = JSON.parse(read('storekit/Kitted.storekit')) as {
    products: unknown[];
    nonRenewingSubscriptions: unknown[];
    subscriptionGroups: { subscriptions: { productID: string; displayPrice: string; recurringSubscriptionPeriod: string; type: string; familyShareable: boolean; introductoryOffer: { paymentMode: string; subscriptionPeriod: string } }[] }[];
  };

  it('K1 one group, one product: Pro monthly at $9.99 with a 1-week free trial, nothing else', () => {
    expect(sk.products).toEqual([]);
    expect(sk.nonRenewingSubscriptions).toEqual([]);
    expect(sk.subscriptionGroups).toHaveLength(1);
    const subs = sk.subscriptionGroups[0].subscriptions;
    expect(subs).toHaveLength(1);
    expect(subs[0]).toMatchObject({
      productID: PRO_MONTHLY.id, displayPrice: PRO_MONTHLY.price.replace('$', ''), recurringSubscriptionPeriod: 'P1M',
      type: 'RecurringSubscription', familyShareable: false, introductoryOffer: { paymentMode: 'free', subscriptionPeriod: `P${PRO_MONTHLY.trialDays / 7}W` },
    });
  });

  it('K2 the plugin puts the reference in the Debug scheme\'s Run, once', () => {
    const { withStoreKitRef, STOREKIT_REF } = require('../../plugins/withStoreKitConfig.js') as { withStoreKitRef: (xml: string) => string; STOREKIT_REF: string };
    const xml = '<Scheme>\n   <LaunchAction\n      buildConfiguration = "Debug">\n   </LaunchAction>\n   <ProfileAction buildConfiguration = "Release">\n   </ProfileAction>\n</Scheme>';
    const once = withStoreKitRef(xml);
    expect(withStoreKitRef(once)).toBe(once);
    const launch = once.slice(once.indexOf('<LaunchAction'), once.indexOf('</LaunchAction>'));
    expect(launch).toContain(`identifier = "${STOREKIT_REF}"`);
    expect(once.slice(once.indexOf('<ProfileAction'))).not.toContain('StoreKit');
    expect(loadConfig().default.plugins).toContain('./plugins/withStoreKitConfig.js');
  });
});

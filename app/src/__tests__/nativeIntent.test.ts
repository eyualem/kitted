import { redirectSystemPath } from '@/app/+native-intent';

jest.mock('@/demo/config', () => ({ DEMO_ENABLED: true }));

describe('+native-intent', () => {
  it('maps kitted://demo/screen/9 to the demo route, keeping the query', () => {
    expect(redirectSystemPath({ path: 'kitted://demo/screen/9?latency=0', initial: true })).toBe('/demo/screen/9?latency=0');
  });

  it('passes plain paths through', () => {
    expect(redirectSystemPath({ path: '/closet', initial: false })).toBe('/closet');
    expect(redirectSystemPath({ path: 'kitted://closet/item/T1', initial: false })).toBe('/closet/item/T1');
  });
});

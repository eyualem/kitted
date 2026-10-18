// The morning card's words (02 "S1d"): why lines, the weather strip, and the result's weather tip.
import type { DayWeather } from '@kitted/core';
import type { ClosetItemRow } from '@/data/types';
import { stripLines, weatherLine, whyLine, type CardWeather } from '@/features/morning/copy';
import { weatherTipText } from '@/features/morning/weatherTip';

const item = (id: string, name: string) => ({ id, name }) as unknown as ClosetItemRow;
const DAY: DayWeather = { window: 'day', nowF: 46.4, highF: 63, lowF: 44, feelsLowF: 42, feelsHighF: 61, precipChance: 0.7, precipFromHour: 17, condition: 'cloudy' };

describe('morning card copy', () => {
  it('why line names the pieces', () => {
    const items = [item('L1', 'Navy overshirt'), item('S4', 'Black Chelsea boots')];
    expect(whyLine([{ key: 'layerOff', itemId: 'L1' }, { key: 'wetShoes', itemId: 'S4' }], items, 'class')).toBe(
      'Navy overshirt for the cold start; it comes off by afternoon. Black Chelsea boots for the rain.',
    );
    expect(whyLine([{ key: 'layerLate', itemId: 'L1' }], items, 'going_out')).toBe('Keep the navy overshirt on; it gets cold late.');
    expect(whyLine([{ key: 'occasion' }], items, 'date')).toBe('Clean and easy for a date.');
    expect(whyLine([{ key: 'occasion' }], items, 'class')).toBe('Clean and easy for class.');
  });

  it('weather strip: rounded temps, rain later vs already raining', () => {
    expect(stripLines(DAY, 7)).toEqual({ main: '46° now · 63° high', rain: 'Rain likely after 5 pm' });
    expect(stripLines(DAY, 18).rain).toBe('Rain likely');
    expect(stripLines({ ...DAY, precipChance: 0.1 }, 7).rain).toBe('Dry all day');
    expect(stripLines({ ...DAY, window: 'evening', nowF: 52, lateF: 47, precipChance: 0 }, 18)).toEqual({ main: '52° at 8 pm · 47° by midnight', rain: 'Dry tonight' });
  });

  it('result tip says "after 6 pm" only before 6 pm', () => {
    expect(weatherTipText({ key: 'wetLight', fromHour: 18 }, 7)).toBe('Rain after 6 pm: light sneakers will show it.');
    expect(weatherTipText({ key: 'wetLight', fromHour: 18 }, 18)).toBe('Rain today: light sneakers will show it.');
    expect(weatherTipText({ key: 'coldNoLayer', fromHour: null }, 8)).toBe('Cold out: bring a layer.');
  });
});

describe('weatherLine (#338): said for the hour he reads it', () => {
  const day: CardWeather = { window: 'day', nowF: 46, highF: 63, lowF: 44, feelsLowF: 42, feelsHighF: 61, precipChance: 0.7, precipFromHour: 17, condition: 'cloudy', nowHour: 7, highHour: 14 };
  const eve: CardWeather = { window: 'evening', nowF: 52, highF: 55, lowF: 47, feelsLowF: 45, feelsHighF: 54, precipChance: 0.6, precipFromHour: 21, condition: 'rain', lateF: 47, nowHour: 20, lateHour: 0 };
  const nb = (s: string) => s.replace(/\u00A0/g, ' ');

  it('by day: the high and the rain with their hours, dropped once they pass', () => {
    expect(nb(weatherLine(day, 7))).toBe('46° now · 63° by 2 pm · rain after 5 pm');
    expect(nb(weatherLine(day, 15))).toBe('46° now · rain after 5 pm');
    expect(nb(weatherLine(day, 18))).toBe('46° now · rain likely');
  });

  it('sample weather has no hours: "high", never a made-up time', () => {
    const { highHour: _h, nowHour: _n, ...sample } = day;
    expect(nb(weatherLine(sample, 7))).toBe('46° now · 63° high · rain after 5 pm');
  });

  it('a small rise is not said', () => {
    expect(nb(weatherLine({ ...day, highF: 48, precipChance: 0 }, 9))).toBe('46° now');
  });

  it('the evening: "at 8 pm" before 8, "now" after, only "now" after midnight', () => {
    expect(nb(weatherLine(eve, 18))).toBe('52° at 8 pm · 47° by midnight · rain after 9 pm');
    expect(nb(weatherLine(eve, 22))).toBe('52° now · 47° by midnight · rain likely');
    expect(nb(weatherLine(eve, 1))).toBe('52° now · rain likely');
  });

  it('a time never breaks across lines', () => {
    expect(weatherLine(day, 7)).toContain('2\u00A0pm');
  });
});

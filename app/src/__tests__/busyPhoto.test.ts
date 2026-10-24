// A second photo while one is reading (09-ui-review §11, K1–K3; §1 item 7): he's told, nothing is sent or counted,
// and the photo's temporary original is deleted (prep never ran, so nothing else would delete it).
import { explain, startCheck } from '@/features/camera/startCheck';
import { fitCheck } from '@/features/fitcheck/session';
import { showToast } from '@/features/toast/toast';
import { t } from '@/i18n/en';
import { discardTempPhoto } from '@/services/tempPhoto';

jest.mock('@/features/toast/toast', () => ({ showToast: jest.fn() }));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn(), dismissAll: jest.fn() } }));
jest.mock('@/data/db', () => ({ store: {} }));
jest.mock('@/features/fitcheck/session', () => ({ fitCheck: { start: jest.fn(), retry: jest.fn(), pickPerson: jest.fn(), busy: jest.fn(() => false) } }));
jest.mock('@/services/tempPhoto', () => ({ discardTempPhoto: jest.fn() }));

const BUSY_LINE = "Still reading your last photo. Send this one when it's done.";

const WAITS_LINE = "Got it. I'll read this one right after your last check.";

beforeEach(() => {
  jest.mocked(showToast).mockClear();
  jest.mocked(discardTempPhoto).mockClear();
  jest.mocked(fitCheck.busy).mockReturnValue(false);
});

test('K1: a photo refused as busy says so; nothing else happens', async () => {
  jest.mocked(fitCheck.start).mockResolvedValueOnce({ outcome: 'busy' });
  const r = await startCheck('check', { photoUri: 'file:///tmp/kitted-capture-7.jpg' });
  expect(r.outcome).toBe('busy');
  expect(t('cam.busy')).toBe(BUSY_LINE);
  expect(showToast).toHaveBeenCalledWith(BUSY_LINE);
  expect(fitCheck.start).toHaveBeenCalledTimes(1);
});

test('K2: its temporary original is deleted, after the line shows', async () => {
  const order: string[] = [];
  jest.mocked(showToast).mockImplementationOnce(() => { order.push('toast'); return 1; });
  jest.mocked(discardTempPhoto).mockImplementationOnce(() => { order.push('discard'); });
  jest.mocked(fitCheck.start).mockResolvedValueOnce({ outcome: 'busy' });
  await startCheck('check', { photoUri: 'file:///tmp/kitted-capture-8.jpg' });
  expect(discardTempPhoto).toHaveBeenCalledWith('file:///tmp/kitted-capture-8.jpg');
  expect(order).toEqual(['toast', 'discard']);
  // A sample photo (no file of his) has nothing to delete.
  jest.mocked(fitCheck.start).mockResolvedValueOnce({ outcome: 'busy' });
  await startCheck('check', { photoId: 's15' });
  expect(discardTempPhoto).toHaveBeenCalledTimes(1);
});

test('K3: the other outcomes keep their own answer', () => {
  explain({ outcome: 'whichOne', messageId: 'M-1' } as never);
  explain({ outcome: 'held', checkId: 'FC-9' });
  expect(showToast).not.toHaveBeenCalled();
  explain({ outcome: 'limit' });
  expect(showToast).toHaveBeenLastCalledWith(t('stylist.quota.used'));
  explain({ outcome: 'error' });
  expect(showToast).toHaveBeenLastCalledWith(t('fail.ai'));
  expect(jest.mocked(showToast).mock.calls.flat()).not.toContain(BUSY_LINE);
});

test('O10 (#371): a photo while another check is going is told it waits its turn; it is kept and scored later', async () => {
  jest.mocked(fitCheck.busy).mockReturnValue(true);
  jest.mocked(fitCheck.start).mockResolvedValueOnce({ outcome: 'scored', checkId: 'FC-2' });
  const r = await startCheck('recheck', { photoUri: 'file:///tmp/kitted-capture-9.jpg' }, 'FC-1');
  expect(r.outcome).toBe('scored');
  expect(t('cam.waits')).toBe(WAITS_LINE);
  expect(showToast).toHaveBeenCalledWith(WAITS_LINE);
  expect(discardTempPhoto).not.toHaveBeenCalled();
});

test('O10b: nothing going: no line; a photo dropped while it waited (a reset) is deleted, with nothing said', async () => {
  jest.mocked(fitCheck.start).mockResolvedValueOnce({ outcome: 'scored', checkId: 'FC-3' });
  await startCheck('check', { photoUri: 'file:///tmp/kitted-capture-10.jpg' });
  expect(showToast).not.toHaveBeenCalled();
  jest.mocked(fitCheck.start).mockResolvedValueOnce({ outcome: 'dropped' });
  await startCheck('check', { photoUri: 'file:///tmp/kitted-capture-11.jpg' });
  expect(showToast).not.toHaveBeenCalled();
  expect(discardTempPhoto).toHaveBeenCalledWith('file:///tmp/kitted-capture-11.jpg');
});

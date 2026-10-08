import { resolveStoredPath, toStoredPath } from '@/services/photoFiles';

// jest.mock is hoisted above the import.
jest.mock('expo-file-system', () => ({ Paths: { document: { uri: 'file:///var/mobile/Containers/Data/Application/NEW-UUID/Documents/' } } }));

const OLD = 'file:///var/mobile/Containers/Data/Application/OLD-UUID/Documents/photos/abc-photo.jpg';

describe('photo paths survive a reinstall', () => {
  it('stores files under Documents relative to it', () => {
    expect(toStoredPath(OLD)).toBe('photos/abc-photo.jpg');
    expect(toStoredPath(null)).toBeNull();
  });

  it('resolves a stored path on the current container', () => {
    expect(resolveStoredPath('photos/abc-photo.jpg')).toBe('file:///var/mobile/Containers/Data/Application/NEW-UUID/Documents/photos/abc-photo.jpg');
  });

  it('re-roots rows saved as absolute URLs before the fix', () => {
    expect(resolveStoredPath(OLD)).toBe('file:///var/mobile/Containers/Data/Application/NEW-UUID/Documents/photos/abc-photo.jpg');
  });

  it('leaves other URLs alone', () => {
    expect(toStoredPath('file:///tmp/x.jpg')).toBe('file:///tmp/x.jpg');
    expect(resolveStoredPath('https://example.com/x.jpg')).toBe('https://example.com/x.jpg');
  });
});

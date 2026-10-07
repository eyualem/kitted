// The query string the app was opened with (cold-start deep link), so boot can apply
// resetData/theme/now before the first screen. Web reads the page URL.
import * as Linking from 'expo-linking';

export async function readInitialQuery(): Promise<string> {
  const url = await Linking.getInitialURL();
  if (!url) return '';
  const q = url.indexOf('?');
  return q < 0 ? '' : url.slice(q + 1).split('#')[0] ?? '';
}

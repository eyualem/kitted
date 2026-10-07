export async function readInitialQuery(): Promise<string> {
  return typeof window === 'undefined' ? '' : window.location.search;
}

// Web preview: the same interface, in memory. Data resets on reload, which is what the preview
// loop wants (every screenshot starts from its scenario).
import { appTracking } from '@/sync/appTracking';
import { createMemoryStore } from './memoryStore';

export const store = createMemoryStore();
/** The web preview never syncs: the raw store is the same store. */
export const rawStore = store;
export const tracking = appTracking(rawStore);
export { LATEST_VERSION } from './migrations';

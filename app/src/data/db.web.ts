// Web preview: the same interface, in memory. Data resets on reload, which is what the preview
// loop wants (every screenshot starts from its scenario).
import { createMemoryStore } from './memoryStore';

export const store = createMemoryStore();
export { LATEST_VERSION } from './migrations';

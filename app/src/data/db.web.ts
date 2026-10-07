// Web preview: the same interface, in memory. Data resets on reload, which is what the
// preview loop wants (every screenshot starts from its scenario).
import { LATEST_VERSION } from './migrations';
import type { KittedStore } from './store';

const kv = new Map<string, string>();

export const store: KittedStore = {
  async init() {},
  async schemaVersion() {
    return LATEST_VERSION;
  },
  async getKv(key) {
    return kv.get(key) ?? null;
  },
  async setKv(key, value) {
    kv.set(key, value);
  },
  async deleteKv(key) {
    kv.delete(key);
  },
  async wipe() {
    kv.clear();
  },
};

export { LATEST_VERSION };

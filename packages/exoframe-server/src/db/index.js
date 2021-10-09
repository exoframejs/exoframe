// npm packages
import Loki from 'lokijs';
import { join } from 'path';
// our packages
import { baseFolder } from '../config/index.js';

// TTL for auth requests
const REQ_TTL =
  process.env.NODE_ENV !== 'testing'
    ? 5 * 60 * 1000 // 5 mins for prod
    : 0; // 0 for tests

// init in-memory adapter for login requests
const memAdapter = new Loki.LokiMemoryAdapter();
const fsAdapter = new Loki.LokiFsAdapter();

// init in-memory requests db
export const db = new Loki('requests.db', { adapter: memAdapter, autoload: true });
// init persistent tokens db
let tokenCollection = {};
export const tokenDb = new Loki(join(baseFolder, 'auth.db'), {
  adapter: process.env.NODE_ENV !== 'testing' ? fsAdapter : memAdapter,
  autoload: true,
  autoloadCallback() {
    // get of create tokens collection
    tokenCollection = tokenDb.getCollection('tokens');
    if (tokenCollection === null) {
      tokenCollection = tokenDb.addCollection('tokens');
    }
  },
  autosave: process.env.NODE_ENV !== 'testing',
});

// create requests collection
export const reqCollection = db.addCollection('requests', {
  ttl: REQ_TTL,
  ttlInterval: REQ_TTL,
});

export function getTokenCollection() {
  return tokenCollection;
}

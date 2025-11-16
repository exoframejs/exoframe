// npm packages
import Loki from 'lokijs';
import { join } from 'path';
// our packages
import { baseFolder } from '../config/paths.js';

// init in-memory adapter for login requests
const memAdapter = new Loki.LokiMemoryAdapter();
const fsAdapter = new Loki.LokiFsAdapter();

// init persistent secrets db
let secretsCollection = {};
let secretResolve = () => {};
export const secretsInited = new Promise((r) => {
  secretResolve = r;
});
export const secretDb = new Loki(join(baseFolder, 'secrets.db'), {
  adapter: process.env.NODE_ENV !== 'testing' ? fsAdapter : memAdapter,
  autoload: true,
  autoloadCallback() {
    // get of create secrets collection
    secretsCollection = secretDb.getCollection('secrets');
    if (secretsCollection === null) {
      secretsCollection = secretDb.addCollection('secrets');
    }
    secretResolve();
  },
  autosave: process.env.NODE_ENV !== 'testing',
});

export function getSecretsCollection() {
  return secretsCollection;
}

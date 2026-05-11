// npm packages
import Loki from 'lokijs';
import { join } from 'path';
// our packages
import { baseFolder } from '../config/paths.ts';

// init in-memory adapter for login requests
const memAdapter = new Loki.LokiMemoryAdapter();
const fsAdapter = new Loki.LokiFsAdapter();

// init persistent secrets db
interface SecretDoc {
  user: string;
  name: string;
  value?: string;
  meta?: {
    created: string;
  };
}

interface SecretCollection {
  insert(document: SecretDoc): SecretDoc;
  find(query?: Partial<SecretDoc>): SecretDoc[];
  findOne(query: Partial<SecretDoc>): SecretDoc | null;
  remove(document: SecretDoc): void;
}

const emptySecretCollection = (): SecretCollection => ({
  insert(document) {
    return document;
  },
  find() {
    return [];
  },
  findOne() {
    return null;
  },
  remove() {},
});

let secretsCollection: SecretCollection = emptySecretCollection();
let secretResolve: (value?: void | PromiseLike<void>) => void = () => {};
export const secretsInited = new Promise<void>((r) => {
  secretResolve = r;
});
export const secretDb = new Loki(join(baseFolder, 'secrets.db'), {
  adapter: process.env.NODE_ENV !== 'testing' ? fsAdapter : memAdapter,
  autoload: true,
  autoloadCallback() {
    // get of create secrets collection
    secretsCollection = secretDb.getCollection<SecretDoc>('secrets') ?? emptySecretCollection();
    if (secretsCollection.find().length === 0 && secretDb.getCollection<SecretDoc>('secrets') === null) {
      secretsCollection = secretDb.addCollection<SecretDoc>('secrets');
    }
    secretResolve();
  },
  autosave: process.env.NODE_ENV !== 'testing',
});

export function getSecretsCollection() {
  return secretsCollection;
}

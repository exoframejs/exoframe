// npm packages
import Loki from 'lokijs';
import { join } from 'path';
// our packages
import { baseFolder } from '../config/paths.ts';

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
interface LoginRequestDoc {
  phrase: string;
  uid: string;
}

interface TokenDoc {
  tokenName: string;
  user: string;
  meta?: {
    created: string;
  };
}

interface TokenCollection {
  insert(document: TokenDoc): TokenDoc;
  find(query?: Partial<TokenDoc>): TokenDoc[];
  findOne(query: Partial<TokenDoc>): TokenDoc | null;
  remove(document: TokenDoc): void;
}

const emptyTokenCollection = (): TokenCollection => ({
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

let tokenCollection: TokenCollection = emptyTokenCollection();
export const tokenDb = new Loki(join(baseFolder, 'auth.db'), {
  adapter: process.env.NODE_ENV !== 'testing' ? fsAdapter : memAdapter,
  autoload: true,
  autoloadCallback() {
    // get of create tokens collection
    tokenCollection = tokenDb.getCollection<TokenDoc>('tokens') ?? emptyTokenCollection();
    if (tokenCollection.find().length === 0 && tokenDb.getCollection<TokenDoc>('tokens') === null) {
      tokenCollection = tokenDb.addCollection<TokenDoc>('tokens');
    }
  },
  autosave: process.env.NODE_ENV !== 'testing',
});

// create requests collection
export const reqCollection = db.addCollection<LoginRequestDoc>('requests', {
  ttl: REQ_TTL,
  ttlInterval: REQ_TTL,
});

export function getTokenCollection() {
  return tokenCollection;
}

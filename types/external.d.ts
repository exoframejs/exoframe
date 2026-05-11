type HighlandValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Buffer
  | { [key: string]: string | number | boolean | null | undefined }
  | Array<string | number | boolean | null | undefined>;

declare module 'apache-md5' {
  export default function md5(value: string): string;
}

declare module 'highland' {
  interface HighlandStream<T = HighlandValue> {
    split(): HighlandStream<string>;
    filter(predicate: (value: T) => boolean): HighlandStream<T>;
    flatten<U = T extends (infer V)[] ? V : T>(): HighlandStream<U>;
    on(event: 'data', listener: (value: T) => void): this;
    on(event: 'end', listener: () => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
    write?(value: HighlandValue): void;
    end?(value?: HighlandValue): void;
    toNodeStream(): NodeJS.ReadableStream;
  }

  interface HighlandStatic {
    <T = HighlandValue>(value?: HighlandValue | HighlandValue[] | NodeJS.ReadableStream | Promise<T>): HighlandStream<T>;
  }

  const highland: HighlandStatic;
  export default highland;
}

declare module 'multimatch' {
  export default function multimatch(items: string[], patterns: string[]): string[];
}

declare module 'sshpk' {
  interface PublicKey {
    createVerify(algorithm: string): {
      update(value: string): void;
      verify(signature: string | Buffer): boolean;
    };
  }

  interface PrivateKey {
    type: string;
    createSign(algorithm: string): {
      update(value: string): void;
      sign(): {
        toString(format: string): string;
        toBuffer(): Buffer;
      };
    };
  }

  const sshpk: {
    parseKey(key: string | Buffer): PublicKey;
    parsePrivateKey(key: Buffer, format: string, options?: { passphrase?: string }): PrivateKey;
  };

  export default sshpk;
}

declare module 'tar-fs' {
  import type { Headers } from 'tar-stream';

  interface PackOptions {
    ignore?: (name: string) => boolean;
    map?: (headers: Headers & { name: string }) => Headers & { name: string };
  }

  function pack(cwd: string, options?: PackOptions): NodeJS.ReadableStream;
  function extract(path: string): NodeJS.WritableStream;

  const tar: {
    pack: typeof pack;
    extract: typeof extract;
  };

  export { pack, extract };
  export default tar;
}

declare module 'tar-stream' {
  export interface Headers {
    name: string;
  }
}

declare module 'lokijs' {
  export interface Collection<T extends object> {
    insert(document: T): T;
    find(query?: Partial<T>): T[];
    findOne(query: Partial<T>): T | null;
    remove(document: T): void;
  }

  interface AddCollectionOptions {
    ttl?: number;
    ttlInterval?: number;
  }

  interface LokiOptions {
    adapter?: object;
    autoload?: boolean;
    autoloadCallback?: () => void;
    autosave?: boolean;
  }

  class Loki {
    constructor(filename?: string, options?: LokiOptions);
    static LokiMemoryAdapter: new () => object;
    static LokiFsAdapter: new () => object;
    addCollection<T extends object>(name: string, options?: AddCollectionOptions): Collection<T>;
    getCollection<T extends object>(name: string): Collection<T> | null;
  }

  export default Loki;
}

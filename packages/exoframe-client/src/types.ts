import type EventEmitter from 'node:events';
import type { Readable } from 'node:stream';
import type { Headers } from 'tar-stream';

export type NestedValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Error
  | Buffer
  | NestedValue[]
  | { [key: string]: NestedValue };

export interface NetworkSpec {
  Aliases?: string[];
}

export interface ServiceSpec {
  Id: string;
  ID?: string;
  Name: string;
  Config: {
    Labels: Record<string, string | undefined>;
  };
  NetworkSettings: {
    Networks: Record<string, NetworkSpec | undefined>;
  };
  State?: {
    Status?: string;
  };
  Spec?: {
    Name?: string;
    Labels?: Record<string, string | undefined>;
    Networks?: NetworkSpec[];
    TaskTemplate?: {
      Networks?: NetworkSpec[];
    };
  };
}

export interface FormattedService {
  deploymentName: string | undefined;
  name: string;
  domain: string;
  host: string;
  status: string;
  project: string | undefined;
  type: string;
}

export interface DeployParams {
  folder?: string;
  endpoint: string;
  token?: string;
  update?: boolean;
  configFile?: string;
  verbose?: number;
}

export type LogEntry = NestedValue[];

export interface DeployResponseData {
  level: string;
  deployments?: ServiceSpec[];
  message?: string;
  error?: string;
  log?: NestedValue[];
}

export interface DeployResult {
  formattedServices: FormattedService[];
  log: LogEntry[];
}

export interface StreamToResponseParams {
  tarStream: Readable;
  remoteUrl: string;
  options?: Record<string, NestedValue>;
  verbose?: number;
  log?: (...args: NestedValue[]) => void;
}

export interface User {
  username: string;
  password: string;
}

export interface FunctionalDeploymentConfig {
  type?: string;
  route?: string;
}

export interface RateLimitConfig {
  average?: number;
  burst?: number;
}

export interface Config {
  name: string;
  restart?: string;
  domain?: string | boolean;
  port?: string;
  project?: string;
  env?: Record<string, string> | null;
  labels?: Record<string, string> | null;
  middlewares?: string[];
  volumes?: string[];
  hostname?: string;
  template?: string;
  image?: string;
  imageFile?: string;
  compress?: boolean;
  letsencrypt?: boolean;
  rateLimit?: RateLimitConfig | null;
  basicAuth?: string | boolean;
  function?: FunctionalDeploymentConfig | null;
}

export interface CreateConfigParams {
  name: string;
  domain?: string;
  port?: string;
  project?: string;
  restart?: string;
  env?: Record<string, string>;
  labels?: Record<string, string>;
  hostname?: string;
  template?: string;
  compress?: boolean;
  letsencrypt?: boolean;
  ratelimitAverage?: number;
  ratelimitBurst?: number;
  basicAuth?: User[];
  functionalDeployment?: FunctionalDeploymentConfig;
}

export interface Secret {
  name: string;
  value?: string;
  meta?: {
    created: string;
  };
}

export interface Token {
  name: string;
  value?: string;
  meta?: {
    created: string;
  };
}

export interface TemplateLogEntry {
  message: string;
  level?: string;
}

export interface TemplateMutationResult {
  success?: boolean | string;
  removed?: boolean;
  log: Array<string | TemplateLogEntry>;
}

export interface Question {
  message: string;
  name: string;
  type: string;
}

export interface LogMessage {
  message: string;
  level: string;
}

export interface LoginRequest {
  phrase: string;
  loginReqId: string;
}

export interface LoginResponse {
  token: string;
}

export interface UpdateResult {
  server: string;
  latestServer: string;
  serverUpdate: boolean;
  traefik: string;
  latestTraefik: string;
  traefikUpdate: boolean;
}

export interface LogsEmitter extends EventEmitter {
  emit(event: 'data', payload: { date: string; msg: string }): boolean;
  emit(event: 'error', payload: Error): boolean;
  emit(event: 'end'): boolean;
}

export type TarMapHeaders = Headers & { name: string };

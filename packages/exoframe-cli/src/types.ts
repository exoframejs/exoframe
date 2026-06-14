import type { DeploymentStrategy } from 'exoframe-client';

export interface CliUser {
  username: string;
}

export interface CliEndpointConfig {
  endpoint: string;
  user?: CliUser;
  token?: string;
}

export interface CliUserConfig extends CliEndpointConfig {
  endpoints?: CliEndpointConfig[];
}

export interface BasicAuthUser {
  username: string;
  password: string;
}

export interface RateLimitDraft {
  average?: number;
  burst?: number;
}

export interface ProjectConfigDraft {
  $schema?: string;
  name: string;
  domain?: string | boolean;
  port?: string;
  project?: string;
  restart?: string;
  env?: Record<string, string>;
  envString?: string;
  middlewares?: string[];
  labels?: Record<string, string>;
  labelsString?: string;
  volumes?: string[];
  volumesString?: string;
  rateLimit?: RateLimitDraft;
  enableRatelimit?: boolean;
  ratelimitAverage?: number;
  ratelimitBurst?: number;
  hostname?: string;
  template?: string;
  deploymentStrategy?: DeploymentStrategy;
  compress?: boolean;
  letsencrypt?: boolean;
  image?: string;
  imageFile?: string;
  buildargs?: Record<string, string>;
  basicAuth?: string | boolean;
  users?: BasicAuthUser[];
  function?: boolean;
}

export type PromptValue = string | number | boolean | undefined;
export type PromptAnswers = Record<string, PromptValue>;
export interface CliPromptQuestion {
  type: string;
  name: string;
  message: string;
  default?: PromptValue;
  choices?: readonly string[] | object[];
  filter?: (input: string, answers?: PromptAnswers) => PromptValue;
  format?: (input: string, answers?: PromptAnswers) => PromptValue;
  validate?: (input: string, answers?: PromptAnswers) => boolean | string;
  when?: (answers: PromptAnswers) => boolean;
  pageSize?: number;
}

export interface ErrorResponse {
  statusCode?: number;
  error?: string;
  log?: string[];
}

export interface CliError extends Error {
  response?: ErrorResponse;
}

export interface DeployHandlerOptions {
  config?: string;
  endpoint?: string;
  token?: string;
  update?: boolean;
  open?: boolean;
  verbose?: number;
}

export interface LoginHandlerOptions {
  key?: string;
  passphrase?: string;
  url?: string;
}

export interface SetupHandlerOptions {
  verbose?: boolean;
}

export interface TemplateHandlerOptions {
  verbose?: boolean;
}

export interface SecretPromptOptions {
  name?: string;
  value?: string;
}

export interface SecretGetOptions {
  yes?: boolean;
}

export interface RemoveHandlerOptions {
  token?: string;
}

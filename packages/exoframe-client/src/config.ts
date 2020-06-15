import md5 from 'apache-md5';

export type FunctionalDeploymentType = {
  type: string;
  route: string;
} | null;

type RateLimitConfig = {
  average?: number;
  burst?: number;
} | null;

export interface KeyValueObject {
  [key: string]: string;
}

export interface User {
  username: string;
  password: string;
}

export interface Config {
  name: string;
  domain: string;
  port: string;
  project: string;
  restart: string;
  env: KeyValueObject | null;
  labels: KeyValueObject | null;
  hostname: string;
  template: string;
  compress?: boolean;
  letsencrypt?: boolean;
  rateLimit: RateLimitConfig;
  basicAuth: string | boolean;
  function: FunctionalDeploymentType;
}

const defaultConfig: Config = {
  name: '',
  domain: '',
  port: '',
  project: '',
  restart: '',
  env: null,
  labels: null,
  hostname: '',
  template: '',
  compress: undefined,
  letsencrypt: undefined,
  rateLimit: null,
  basicAuth: false,
  function: null,
};

interface ConfigParams {
  name: string;
  domain?: string;
  port?: string;
  project?: string;
  restart?: string;
  env?: KeyValueObject;
  labels?: KeyValueObject;
  hostname?: string;
  template?: string;
  compress?: boolean;
  letsencrypt?: boolean;
  ratelimitAverage?: number;
  ratelimitBurst?: number;
  basicAuth?: User[];
  functionalDeployment?: FunctionalDeploymentType;
}

export const createConfig = ({
  name,
  domain,
  port,
  project,
  restart,
  env,
  labels,
  hostname,
  template,
  compress,
  letsencrypt,
  ratelimitAverage,
  ratelimitBurst,
  basicAuth,
  functionalDeployment,
}: ConfigParams): Config => {
  const baseConfig = {
    ...defaultConfig,
    ...(project ? {project} : {}),
    name,
  };

  if (functionalDeployment) {
    // set function flag to true
    baseConfig.function = functionalDeployment;
    return baseConfig;
  }

  const rateLimit: RateLimitConfig = {
    average: ratelimitAverage,
    burst: ratelimitBurst,
  };
  const hasRateLimit: boolean = ratelimitBurst !== undefined || ratelimitAverage !== undefined;

  const basicAuthString: string | undefined = basicAuth?.reduce((acc, curr, index) => {
    const delimeter = basicAuth.length - 1 === index ? '' : ',';
    const pair = `${curr.username}:${md5(curr.password)}`;
    return `${acc}${pair}${delimeter}`;
  }, '');

  // DO NOT USE (var && {...}) - IT WILL KILL TS SERVER
  const newConfig = {
    ...baseConfig,
    ...(domain ? {domain} : {}),
    ...(port ? {port} : {}),
    ...(restart ? {restart} : {}),
    ...(env ? {env} : {}),
    ...(labels ? {labels} : {}),
    ...(hostname ? {hostname} : {}),
    ...(template ? {template} : {}),
    ...(compress !== undefined ? {compress} : {}),
    ...(letsencrypt !== undefined ? {letsencrypt} : {}),
    ...(hasRateLimit ? {rateLimit} : {}),
    ...(basicAuthString ? {basicAuth: basicAuthString} : {}),
  };

  return newConfig;
};

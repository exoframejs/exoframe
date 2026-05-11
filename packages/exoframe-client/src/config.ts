import { createRequire } from 'module';
import type { Config, CreateConfigParams } from './types.ts';

const require = createRequire(import.meta.url);
const hashPassword = require('apache-md5') as (value: string) => string;

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

/**
 * Creates new deployment config from given params
 *
 */
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
}: CreateConfigParams): Config => {
  const baseConfig = {
    ...defaultConfig,
    ...(project ? { project } : {}),
    name,
  };

  if (functionalDeployment) {
    // set function flag to true
    baseConfig.function = functionalDeployment;
    return baseConfig;
  }

  const rateLimit = {
    average: ratelimitAverage,
    burst: ratelimitBurst,
  };
  const hasRateLimit = ratelimitBurst !== undefined || ratelimitAverage !== undefined;

  const basicAuthString = basicAuth?.reduce((acc, curr, index) => {
    const delimeter = basicAuth.length - 1 === index ? '' : ',';
    const pair = `${curr.username}:${hashPassword(curr.password)}`;
    return `${acc}${pair}${delimeter}`;
  }, '');

  // DO NOT USE (var && {...}) - IT WILL KILL TS SERVER
  const newConfig: Config = {
    ...baseConfig,
    ...(domain ? { domain } : {}),
    ...(port ? { port } : {}),
    ...(restart ? { restart } : {}),
    ...(env ? { env } : {}),
    ...(labels ? { labels } : {}),
    ...(hostname ? { hostname } : {}),
    ...(template ? { template } : {}),
    ...(compress !== undefined ? { compress } : {}),
    ...(letsencrypt !== undefined ? { letsencrypt } : {}),
    ...(hasRateLimit ? { rateLimit } : {}),
    ...(basicAuthString ? { basicAuth: basicAuthString } : {}),
  };

  return newConfig;
};

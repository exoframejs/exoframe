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
  // deployment name
  // defaults to folder name
  name: string;
  // restart policy [optional]
  // see docker docs for more info
  // defaults to "on-failure:2"
  restart?: string;
  // domain to be assigned to project [optional]
  // no domain is assigned by default
  // can be set to "false" to disable auto-assignment of domain
  domain?: string | boolean;
  // which exposed port should be used [optional]
  // will default to first exposed port
  // if no ports are exposed - will use 80
  port?: string;
  // project name [optional]
  // by default assembled using deployment name and username
  project?: string;
  // object of key-values for env vars [optional]
  // no env vars are assigned by default
  env?: KeyValueObject;
  // Add additional docker labels to your container [optional]
  labels?: KeyValueObject;
  // any additional traefik middlewares you might have defined
  // either in docker or any other middleware collection
  middlewares?: string[];
  // Add additional docker volumes to your container [optional]
  // while you can use server paths in sourceVolume place
  // it is recommended to use named volumes
  volumes?: string[];
  // internal hostname for container [optional]
  // see docker docs for more info
  // no hostname is assigned by default
  hostname?: string;
  // template to be used for project deployment
  // undefined by default, detected by server based on file structure
  template?: string;
  // image to be used to deploy current project
  // this option overrides any other type of deployment and makes
  // exoframe deploy project using given image name
  image?: string;
  // image file to load image from
  // exoframe will load given tar file into docker daemon before
  // executing image deployment
  imageFile?: string;
  // whether to use gzip on given domain [optional]
  // can also be set for all deployments using server config
  // per-project option will override global setting
  compress?: boolean;
  // whether to use letsencrypt on given domain [optional]
  // can also be set for all deployments using server config
  // per-project option will override global setting
  letsencrypt?: boolean;
  // rate-limit config
  // see "advanced topics" for more info
  rateLimit: RateLimitConfig;
  // basic auth, [optional]
  // this field allows you to have basic auth to access your deployed service
  // format is in user:pwhash
  basicAuth?: string | boolean;
  // function deployment config
  // see "function deployments" for more info
  function?: FunctionalDeploymentType;
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

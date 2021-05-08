import md5 from 'apache-md5';

/**
 * Simple user structure
 * @typedef {object} User
 * @property {string} username - username.
 * @property {string} password - password.
 */

/**
 * Deployment config
 * @typedef {object} Config
 * @property {string} name - deployment name, defaults to folder name.
 * @property {string} [restart] - restart policy, see docker docs for more info, defaults to "on-failure:2".
 * @property {string | boolean} [domain] - domain to be assigned to project, no domain is assigned by default, can be set to "false" to disable auto-assignment of domain
 * @property {string} [port] - which exposed port should be used, will default to first exposed port, if no ports are exposed - will use 80.
 * @property {string} [project] - project name, by default assembled using deployment name and username
 * @property {object} [env] - object of key-values for env vars, no env vars are assigned by default
 * @property {object} [labels] - add additional docker labels to your container
 * @property {string[]} [middlewares] - any additional traefik middlewares you might have defined either in docker or any other middleware collection
 * @property {string[]} [volumes] - Add additional docker volumes to your container while you can use server paths in sourceVolume place it is recommended to use named volumes
 * @property {string} [hostname] - internal hostname for container see docker docs for more info no hostname is assigned by default
 * @property {string} [template] - template to be used for project deployment undefined by default, detected by server based on file structure
 * @property {string} [image] - image to be used to deploy current project this option overrides any other type of deployment and makes exoframe deploy project using given image name
 * @property {string} [imageFile] - image file to load image from exoframe will load given tar file into docker daemon before executing image deployment
 * @property {boolean} [compress] - whether to use gzip on given domain can also be set for all deployments using server config per-project option will override global setting
 * @property {boolean} [letsencrypt] - whether to use letsencrypt on given domain, can also be set for all deployments using server config per-project option will override global setting
 * @property {object} rateLimit - rate-limit config, see "advanced topics" in docs for more info
 * @property {number} rateLimit.average - average requests number for rate-limiting
 * @property {number} rateLimit.burst - burst requests number for rate-limiting
 * @property {string | boolean} [basicAuth] - basic auth, this field allows you to have basic auth to access your deployed service format is in user:pwhash
 * @property {object} [function] - function deployment config, see "function deployments" for more info
 * @property {string} [function.type] - function deployment type
 * @property {string} [function.route] - function deployment route
 */

/**
 * @type{Config}
 */
const defaultConfig = {
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
 * @param {object} deploymentConfig
 * @param {string} deploymentConfig.name - deployment name
 * @param {string} [deploymentConfig.domain] - deployment domain
 * @param {string} [deploymentConfig.port] - deployment port
 * @param {string} [deploymentConfig.project] - deployment project
 * @param {string} [deploymentConfig.restart] - deployment restart policy
 * @param {object} [deploymentConfig.env] - key-value pairs of env vars
 * @param {object} [deploymentConfig.labels] - key-value pairs of labels
 * @param {string} [deploymentConfig.hostname] - deployment hostname
 * @param {string} [deploymentConfig.template] - deployment template to be applied
 * @param {boolean} [deploymentConfig.compress] - whether compression should be enabled or not
 * @param {boolean} [deploymentConfig.letsencrypt] - whether letsencrypt should be enabled or not
 * @param {number} [deploymentConfig.ratelimitAverage] - average number of requests for rate-limiting
 * @param {number} [deploymentConfig.ratelimitBurst] - burst number of requests for rate-limiting
 * @param {User[]} [deploymentConfig.basicAuth] - set of credentials for basic auth
 * @param {object} [deploymentConfig.functionalDeployment] - functional deployment config
 * @param {string} [deploymentConfig.functionalDeployment.type] - function deployment type
 * @param {string} [deploymentConfig.functionalDeployment.route] - function deployment route
 * @returns {Config}
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
}) => {
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
    const pair = `${curr.username}:${md5(curr.password)}`;
    return `${acc}${pair}${delimeter}`;
  }, '');

  // DO NOT USE (var && {...}) - IT WILL KILL TS SERVER
  const newConfig = {
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

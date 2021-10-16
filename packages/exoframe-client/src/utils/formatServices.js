/**
 * Docker network spec
 * @typedef {object} NetworkSpec
 * @property {string[]} Aliases - network aliases
 */

/**
 * Docker service spec
 * @typedef {object} ServiceSpec
 * @property {string} Id - service Id
 * @property {string} [ID] - service ID (because docker)
 * @property {string} Name - service name
 * @property {object} Config - service config
 * @property {object} Config.Labels - key-value object with service labels
 * @property {object} NetworkSettings - network config
 * @property {object} NetworkSettings.Networks - object with networks where key is net name
 * @property {NetworkSpec} NetworkSettings.Networks.NetworkName - network config for current network name
 * @property {object} [State] - service state
 * @property {string} State.Status - service status
 * @property {object} [Spec] - service specifications
 * @property {string} Spec.Name - service name
 * @property {object} Spec.Labels - labels
 * @property {NetworkSpec[]} [Spec.Networks] - networks
 * @property {object} Spec.TaskTemplate - task template spec
 * @property {NetworkSpec[]} Spec.TaskTemplate.Networks - networks
 */

/**
 * Exoframe formatted service format
 * @typedef {object} FormattedService
 * @property {string} name - service name
 * @property {string} domain - service domain
 * @property {string} host - service host
 * @property {string} status - service status
 * @property {string} project - service project
 */

const ruleRegex = /^Host\(`(.+?)`\)$/;

/**
 * Formats given traefik rule
 *
 * @param {string} rule
 * @returns {string}
 */
const formatTraefikRule = (rule) => {
  const match = ruleRegex.exec(rule);
  if (match) {
    return match[1];
  }
  return rule;
};

/**
 * Converts an array of docker service specs to plain {FormattedService} representation
 *
 * @param {ServiceSpec[]} services - array of service specs to format
 * @returns {FormattedService[]}
 */
export const formatServices = (services) =>
  services.map((svc) => {
    const name = svc.Name.slice(1);
    const deploymentName = svc.Config.Labels['exoframe.deployment'];
    const domain = svc.Config.Labels[`traefik.http.routers.${deploymentName}.rule`]
      ? formatTraefikRule(svc.Config.Labels[`traefik.http.routers.${deploymentName}.rule`])
      : 'Not set';
    const networks = svc.NetworkSettings.Networks;
    const aliases = Object.keys(networks)
      .map((networkName) => networks[networkName])
      .filter((net) => net?.Aliases !== undefined && net?.Aliases?.length > 0)
      .map((net) => net.Aliases.filter((alias) => !svc.Id.startsWith(alias)))
      .reduce((acc, val) => acc.concat(val), []);
    const project = svc.Config.Labels['exoframe.project'];
    const host = aliases.shift() ?? 'Not set';
    const status = svc?.State?.Status ?? '';
    const type = svc.Config.Labels['exoframe.type'] ? svc.Config.Labels['exoframe.type'] : 'Container';
    return { name, domain, host, status, project, type };
  });

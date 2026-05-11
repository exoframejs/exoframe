import type { FormattedService, ServiceSpec } from '../types.ts';

const ruleRegex = /^Host\(`(.+?)`\)$/;

/**
 * Formats a Traefik host rule for display.
 *
 * @param rule - Router rule from Docker labels.
 * @returns Human-readable host or raw rule when it cannot be simplified.
 */
const formatTraefikRule = (rule: string): string => {
  const match = ruleRegex.exec(rule);
  if (match) {
    return match[1];
  }
  return rule;
};

/**
 * Converts docker service specs into the simplified deployment shape used by the CLI.
 *
 * @param services - Docker service specs returned by the server.
 * @returns Formatted deployment rows for terminal rendering.
 */
export const formatServices = (services: ServiceSpec[]): FormattedService[] =>
  services.map((svc) => {
    const name = svc.Name.slice(1);
    const deploymentName = svc.Config.Labels['exoframe.deployment'];
    const domainRule = svc.Config.Labels[`traefik.http.routers.${name}.rule`];
    const domain = domainRule
      ? formatTraefikRule(domainRule)
      : 'Not set';
    const networks = svc.NetworkSettings.Networks;
    const aliases = Object.keys(networks)
      .map((networkName) => networks[networkName])
      .filter((net): net is { Aliases: string[] } => Array.isArray(net?.Aliases) && net.Aliases.length > 0)
      .map((net) => net.Aliases.filter((alias) => !svc.Id.startsWith(alias)))
      .reduce<string[]>((acc, val) => acc.concat(val), []);
    const project = svc.Config.Labels['exoframe.project'];
    const host = aliases.shift() ?? 'Not set';
    const status = svc?.State?.Status ?? '';
    const type = svc.Config.Labels['exoframe.type'] ?? 'Container';
    return { deploymentName, name, domain, host, status, project, type };
  });

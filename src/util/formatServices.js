const ruleRegex = /^Host\(`(.+?)`\)$/;
const formatTraefikRule = rule => {
  const match = ruleRegex.exec(rule);
  if (match) {
    return match[1];
  }
  return rule;
};

module.exports = services =>
  services.map(svc => {
    const isSwarm = !!svc.Spec;

    // handle non-swarm deployments
    if (!isSwarm) {
      const name = svc.Name.slice(1);
      const deploymentName = svc.Config.Labels['exoframe.deployment'];
      const domain = svc.Config.Labels[`traefik.http.routers.${deploymentName}.rule`]
        ? formatTraefikRule(svc.Config.Labels[`traefik.http.routers.${deploymentName}.rule`])
        : 'Not set';
      const networks = svc.NetworkSettings.Networks;
      const aliases = Object.keys(networks)
        .map(networkName => networks[networkName])
        .filter(net => net.Aliases && net.Aliases.length > 0)
        .map(net => net.Aliases.filter(alias => !svc.Id.startsWith(alias)))
        .reduce((acc, val) => acc.concat(val), []);
      const project = svc.Config.Labels['exoframe.project'];
      const host = aliases.shift() || 'Not set';
      const status = svc.State ? svc.State.Status : '';
      const type = svc.Config.Labels['exoframe.type'] ? svc.Config.Labels['exoframe.type'] : 'Container';
      return {name, domain, host, status, project, type};
    }

    // handle swarm deployments
    const name = svc.Spec.Name;
    const deploymentName = svc.Spec.Labels['exoframe.deployment'];
    const domain = svc.Spec.Labels[`traefik.http.routers.${deploymentName}.rule`]
      ? formatTraefikRule(svc.Spec.Labels[`traefik.http.routers.${deploymentName}.rule`])
      : 'Not set';
    const networks = svc.Spec.Networks || svc.Spec.TaskTemplate.Networks;
    const aliases = networks
      .filter(net => net.Aliases && net.Aliases.length > 0)
      .map(net => net.Aliases.filter(alias => !svc.ID.startsWith(alias)))
      .reduce((acc, val) => acc.concat(val), []);
    const project = svc.Spec.Labels['exoframe.project'];
    const host = aliases.shift() || 'Not set';
    const status = svc.State ? svc.State.Status : '';
    return {name, domain, host, status, project};
  });

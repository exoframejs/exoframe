module.exports = services =>
  services.map(svc => {
    const isSwarm = !!svc.Spec;

    // handle non-swarm deployments
    if (!isSwarm) {
      const name = svc.Name.slice(1);
      const domain = svc.Config.Labels['traefik.frontend.rule']
        ? svc.Config.Labels['traefik.frontend.rule'].replace('Host:', '')
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
      const type = svc.Id ? 'container' : 'function';
      return {name, domain, host, status, project, type};
    }

    // handle swarm deployments
    const name = svc.Spec.Name;
    const domain = svc.Spec.Labels['traefik.frontend.rule']
      ? svc.Spec.Labels['traefik.frontend.rule'].replace('Host:', '')
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

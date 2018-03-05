module.exports = services =>
  services.map(svc => {
    const isSwarm = !!svc.Spec;

    // handle non-swarm deployments
    if (!isSwarm) {
      const name = svc.Name.slice(1);
      const domain = svc.Config.Labels['traefik.frontend.rule']
        ? svc.Config.Labels['traefik.frontend.rule'].replace('Host:', '')
        : 'Not set';
      const aliases =
        svc.NetworkSettings.Networks.exoframe && svc.NetworkSettings.Networks.exoframe.Aliases
          ? svc.NetworkSettings.Networks.exoframe.Aliases.filter(alias => !svc.Id.startsWith(alias))
          : [];
      const project = svc.Config.Labels['exoframe.project'];
      const host = aliases.shift() || 'Not set';
      const status = svc.State ? svc.State.Status : '';
      return {name, domain, host, status, project};
    }

    // handle swarm deployments
    const name = svc.Spec.Name;
    const domain = svc.Spec.Labels['traefik.frontend.rule']
      ? svc.Spec.Labels['traefik.frontend.rule'].replace('Host:', '')
      : 'Not set';
    const aliases = svc.Spec.Networks && svc.Spec.Networks.length > 0 ? svc.Spec.Networks.map(n => n.Aliases) : [];
    const project = svc.Spec.Labels['exoframe.project'];
    const host = aliases.shift() || 'Not set';
    const status = svc.State ? svc.State.Status : '';
    return {name, domain, host, status, project};
  });

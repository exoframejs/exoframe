module.exports = services =>
  services.map(svc => {
    const name = svc.Name.slice(1);
    const domain = svc.Config.Labels['traefik.frontend.rule']
      ? svc.Config.Labels['traefik.frontend.rule'].replace('Host:', '')
      : 'Not set';
    const aliases = svc.NetworkSettings.Networks.exoframe.Aliases
      ? svc.NetworkSettings.Networks.exoframe.Aliases.filter(alias => !svc.Id.startsWith(alias))
      : [];
    const project = svc.Config.Labels['exoframe.project'];
    const host = aliases.shift() || 'Not set';
    const status = svc.State ? svc.State.Status : '';
    return {name, domain, host, status, project};
  });

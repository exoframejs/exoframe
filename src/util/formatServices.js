module.exports = services =>
  services.map(svc => {
    const name = svc.Name.slice(1);
    const domain = svc.Config.Labels['traefik.frontend.rule']
      ? svc.Config.Labels['traefik.frontend.rule'].replace('Host:', '')
      : 'Not set';
    const aliases = Object.keys(svc.NetworkSettings.Networks)
      .map(networkName => svc.NetworkSettings.Networks[networkName])
      .filter(net => net.Aliases && net.Aliases.length > 0)
      .map(net => net.Aliases.filter(alias => !svc.Id.startsWith(alias)))
      .reduce((acc, val) => acc.concat(val), []);
    const project = svc.Config.Labels['exoframe.project'];
    const host = aliases.shift() || 'Not set';
    const status = svc.State ? svc.State.Status : '';
    return {name, domain, host, status, project};
  });

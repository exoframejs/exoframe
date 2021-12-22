import { deploy } from 'exoframe-client';
import { Box, Text } from 'ink';
import openLink from 'open';
import React, { useEffect, useMemo, useState } from 'react';
import { getConfig, isLoggedIn } from '../../config/index.js';
/**
 * Deployment process component
 *
 * @param {Object} props
 * @param {Object} [props.folder] - folder to deploy (default: current folder)
 * @param {Object} [props.config] - exoframe config override
 * @param {Object} [props.endpoint] - exoframe endpoint URL (defaults to current endpoint in config)
 * @param {Object} [props.token] - exoframe deployment token (defaults to current token in config)
 * @param {Object} [props.update] - whether to deploy project as an update (defaults to false)
 * @param {Object} [props.open] - whether to open the final URL in browser (defaults to false)
 * @param {Object} [props.verbose] - level of loggin verbosity (defaults to 0)
 * @returns {React.ReactElement} Deployment process component
 */
export default function Deploy({ folder, config, endpoint, token, update, open, verbose }) {
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [log, setLog] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [error, setError] = useState(null);
  const userConfig = useMemo(() => getConfig(), []);
  // exit if not logged in and no token provided
  if (!token && !isLoggedIn()) {
    return;
  }

  useEffect(() => {
    if (loading) {
      return;
    }

    async function deployProject() {
      try {
        setLoading(true);
        const { formattedServices, log } = await deploy({
          folder,
          endpoint: endpoint ?? userConfig.endpoint,
          token: token ?? userConfig.token,
          update,
          configFile: config,
          verbose,
        });
        setServices(formattedServices);
        setLog(log);
        setLoading(false);
      } catch (err) {
        setLoading(false);
        setError(err);
        // console.error(err);

        const response = err.response || {};
        // if authorization is expired/broken/etc
        if (response.statusCode === 401) {
          // logout(userConfig);
          setErrorMessage('Error: authorization expired! Please, relogin and try again.');
          return;
        }
        const reason = response.error || err.toString();
        setErrorMessage(reason ?? 'Unknown reason');
        setLog(response.log ?? []);
      }
    }

    deployProject();
  }, [folder, endpoint, token, update, config, verbose]);

  useEffect(() => {
    if (open && !error && !loading && services.length) {
      openLink(`http://${services[0].domain.split(',')[0].trim()}`);
    }
  }, [services, open, error, loading]);

  return (
    <Box flexDirection="column">
      <Text bold>
        {update ? 'Updating' : 'Deploying'} {folder || 'current project'} to: {endpoint ?? userConfig.endpoint}
      </Text>
      {loading && <Text bold>Loading..</Text>}
      {services.length > 0 && (
        <Box flexDirection="column">
          <Text bold>Deployed services:</Text>
          <Box>
            <Text>ID</Text>
            <Text>URL</Text>
            <Text>Hostname</Text>
            <Text>Type</Text>
          </Box>
          {services.map((svc) => (
            <Box key={svc.name}>
              <Text>{svc.name}</Text>
              <Text>{svc.domain}</Text>
              <Text>{svc.host}</Text>
              <Text>{svc.type}</Text>
            </Box>
          ))}
        </Box>
      )}
      {errorMessage && <Text bold>Error: {errorMessage}</Text>}
      {(verbose > 0 || errorMessage) && log?.length > 0 && (
        <Box flexDirection="column" paddingLeft={1}>
          <Text>Log:</Text>
          {(log ?? ['No log available'])
            .filter((l) => l !== undefined)
            .map((l) => l.trim())
            .filter((l) => l && l.length > 0)
            .map((line) => (
              <Box key={line} paddingLeft={1}>
                <Text>{line}</Text>
              </Box>
            ))}
        </Box>
      )}
      {verbose > 1 && error && <Text bold>Original error: {error.toString()}</Text>}
      {verbose > 2 && error && <Text bold>Original response: {JSON.stringify(error.response, null, 2)}</Text>}
    </Box>
  );
}

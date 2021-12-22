import { Box, Text } from 'ink';
import React, { useEffect } from 'react';
import { useConfig } from './useConfig.js';

/**
 * Config manipulation component. Allows creating or editing project config file.
 *
 * @param {Object} props
 * @param {Object} [props.domain] - domain to update in project config (non-interactive mode)
 * @param {Object} [props.port] - port to update in project config (non-interactive mode)
 * @param {Object} [props.project] - project to update in project config (non-interactive mode)
 * @param {Object} [props.name] - name to update in project config (non-interactive mode)
 * @param {Object} [props.restart] - restart value to update in project config (non-interactive mode)
 * @param {Object} [props.hostname] - hostname to update in project config (non-interactive mode)
 * @returns {React.ReactElement} Config manipulation component
 */
export default function NonInteractiveConfigUpdate(props) {
  const { status, overrideConfigWith } = useConfig();

  // run update in non-interactive mode
  useEffect(() => {
    overrideConfigWith(props);
  }, [props]);

  return (
    <Box flexDirection="column">
      {status === 'loading' && (
        <Box>
          <Text bold color="yellow">
            Loading config...
          </Text>
        </Box>
      )}
      {status === 'exists' && (
        <Box>
          <Text bold color="green">
            Config already exists! Editing..
          </Text>
        </Box>
      )}
      {status === 'new' && (
        <Box>
          <Text bold color="green">
            Creating new config..
          </Text>
        </Box>
      )}
      <Box flexDirection="column" paddingBottom={1}>
        <Box paddingBottom={1}>
          <Text bold color="cyan">
            Mode changed to:
          </Text>
          <Text> non-interactive</Text>
        </Box>
        {Object.keys(props)
          .filter((prop) => props[prop] !== undefined)
          .map((prop) => (
            <Box key={prop}>
              <Text bold color="yellow">
                Updating {prop} with:
              </Text>
              <Text> {props[prop]}</Text>
            </Box>
          ))}
      </Box>
      {status === 'saved' && (
        <Box>
          <Text bold color="green">
            Config updated!
          </Text>
        </Box>
      )}
    </Box>
  );
}

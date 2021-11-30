import { Box, Text } from 'ink';
import React, { useMemo } from 'react';
import InteractiveConfigUpdate from './interactive.js';
import NonInteractiveConfigUpdate from './noninteractive.js';
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
export default function Config({ ...props }) {
  const { error } = useConfig();

  const nonInteractive = useMemo(() => Object.keys(props).some((val) => props[val]?.length > 0), []);

  // show error if any
  if (error) {
    return (
      <Box flexDirection="column">
        <Text bold color="red">
          Error processing config!
        </Text>
        <Text>{error}</Text>
      </Box>
    );
  }

  // handle non-interactive mode
  if (nonInteractive) {
    return <NonInteractiveConfigUpdate {...props} />;
  }

  return <InteractiveConfigUpdate />;
}

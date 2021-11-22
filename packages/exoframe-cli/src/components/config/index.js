import { Box, Text } from 'ink';
import inkSelectInput from 'ink-select-input';
import inkTextInput from 'ink-text-input';
import React, { useEffect, useMemo } from 'react';
import InteractiveConfigUpdate from './interactive.js';
import { useConfig } from './useConfig.js';

// get ink components (not use ESM yet)
const SelectInput = inkSelectInput.default;
const TextInput = inkTextInput.UncontrolledTextInput;

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
function NonInteractiveConfigUpdate(props) {
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
      {status === 'save' && (
        <Box>
          <Text bold color="green">
            Config updated!
          </Text>
        </Box>
      )}
    </Box>
  );
}

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

import { Box, Text } from 'ink';
import inkSelectInput from 'ink-select-input';
import inkTextInput from 'ink-text-input';
import React, { useMemo, useState } from 'react';
import { getConfig } from '../../config/index.js';
import { useLogin } from './useLogin.js';
import { usePrivateKeys } from './usePrivateKeys.js';

// get ink components (not use ESM yet)
const SelectInput = inkSelectInput.default;
const TextInput = inkTextInput.UncontrolledTextInput;

/**
 * Renders key selection if key is not yet selected
 *
 * @param {Object} props
 * @param {Object} props.showKeySelection - if true, show key selection
 * @param {Object} props.privateKeys - list of private keys to select from
 * @param {Object} props.handleSelect - function triggered when key is selected
 * @returns {React.ReactElement} Key selection component
 */
function KeySelect({ showKeySelection, privateKeys, handleSelect }) {
  if (!showKeySelection) {
    return null;
  }

  return (
    <Box flexDirection="column">
      <Text bold>Select a private key to use:</Text>
      <SelectInput items={privateKeys} onSelect={handleSelect} />
    </Box>
  );
}

/**
 * Renders inputs for passpharse and username when key is selected
 *
 * @param {Object} props
 * @param {Object} props.currentKey - currently selected key
 * @param {Object} props.keypassphrase - currently entered passphrase (if any)
 * @param {Object} props.handlePassphrase - function triggered when passphrase is entered
 * @param {Object} props.username - currently entered username (if any)
 * @param {Object} props.handleUsername - function triggered when username is entered
 * @returns {React.ReactElement} Passphrase and username input component
 */
function AskForPassAndUsername({ currentKey, keypassphrase, handlePassphrase, username, handleUsername }) {
  if (!currentKey) {
    return null;
  }

  return (
    <Box flexDirection="column">
      <Text>Using key: {currentKey.label}</Text>
      {keypassphrase === undefined && (
        <Box>
          <Text>Enter key passpharse (leave blank if not set): </Text>
          <TextInput onSubmit={handlePassphrase} mask="*" />
        </Box>
      )}
      {keypassphrase !== undefined && !username && (
        <Box>
          <Text>Enter your username: </Text>
          <TextInput onSubmit={handleUsername} />
        </Box>
      )}
      {username?.length > 1 && <Text>Using username: {username}</Text>}
    </Box>
  );
}

/**
 * Login process component. Allows selecting a key, entering a passphrase and a username
 *
 * @param {Object} props
 * @param {Object} [props.url] - exoframe endpoint URL (defaults to current endpoint in config)
 * @param {Object} [props.keyPath] - path to selected key file (if passed by user, otherwise selector will be shown)
 * @param {Object} [props.passphrase] - passphrase for given key (if passed by user, otherwise input will be shown)
 * @returns {React.ReactElement} Passphrase and username input component
 */
export default function Login({ keyPath, passphrase, url }) {
  const [currentKey, setCurrentKey] = useState(() => {
    if (!keyPath) return;
    return {
      label: keyPath.split('/').pop(),
      value: keyPath,
    };
  });
  const [username, setUsername] = useState('');
  const [keypassphrase, setKeypassphrase] = useState(passphrase);
  // load private keys if no key is provided
  const { error: keyError, privateKeys } = usePrivateKeys({ skipLoad: currentKey?.length > 0 });
  const {
    error: loginError,
    loading,
    loginResponse,
  } = useLogin({ key: currentKey?.value, passphrase: keypassphrase, url, username });
  // get config
  const config = useMemo(() => getConfig(), []);
  const endpoint = useMemo(() => url ?? config.endpoint, [config.endpoint, url]);

  /*
  TODO: Set current endpoint in config upon login execution
  if (url && url.length) {
    await endpointHandler({ url });
  } 
  */

  const error = keyError || loginError;

  // determine if we should show key selection
  const showKeySelection = useMemo(() => {
    return !currentKey && privateKeys?.length > 0;
  }, [currentKey, privateKeys]);

  // handle key selection
  const handleSelect = (item) => setCurrentKey(item);
  const handlePassphrase = (value) => setKeypassphrase(value);
  const handleUsername = (username) => setUsername(username);

  // show error if any
  if (error) {
    return (
      <Box flexDirection="column">
        <Text bold color="red">
          Error logging in!
        </Text>
        <Text>{error}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text bold>Logging into: {endpoint}</Text>
      <KeySelect showKeySelection={showKeySelection} privateKeys={privateKeys} handleSelect={handleSelect} />
      <AskForPassAndUsername
        currentKey={currentKey}
        keypassphrase={keypassphrase}
        handlePassphrase={handlePassphrase}
        username={username}
        handleUsername={handleUsername}
      />
      {loading && <Text>Loading...</Text>}
      {loginResponse?.length > 1 && <Text>{loginResponse}</Text>}
    </Box>
  );
}

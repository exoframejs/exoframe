import { html } from 'htm/react';
import { Box, Text } from 'ink';
import inkSelectInput from 'ink-select-input';
import inkTextInput from 'ink-text-input';
import { useMemo, useState } from 'react';
import { getConfig } from '../../config/index.js';
import { useLogin } from './useLogin.js';
import { usePrivateKeys } from './usePrivateKeys.js';

// get ink components (not use ESM yet)
const SelectInput = inkSelectInput.default;
const TextInput = inkTextInput.UncontrolledTextInput;

export default function Login({ key, passphrase, url }) {
  const [currentKey, setCurrentKey] = useState(key);
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
    return html`<${Box} flexDirection="column">
      <${Text} bold color="red">Error logging in!<//>
      <${Text}>${error}<//>
    <//>`;
  }

  return html`<${Box} flexDirection="column">
    <${Text} bold>Logging into: ${config.endpoint}<//>
    ${showKeySelection && html`<${SelectInput} items=${privateKeys} onSelect=${handleSelect} />`}
    ${currentKey &&
    html`<${Box} flexDirection="column">
      <${Text}>Using key: ${currentKey.label}<//>
      ${!keypassphrase &&
      html`<${Box}>
        <${Text}>Enter key passpharse (leave blank if not set): <//>
        <${TextInput} onSubmit=${handlePassphrase} mask="*" />
      <//>`}
      ${keypassphrase?.length > 0 &&
      !username &&
      html`<${Box}>
        <${Text}>Enter your username: <//>
        <${TextInput} onSubmit=${handleUsername} />
      <//>`}
      ${username?.length > 1 && html`<${Text}>Using username: ${username}<//>`}
    <//>`}
    ${loading && html`<${Text}>Loading...<//>`}${loginResponse?.length > 1 && html`<${Text}>${loginResponse}<//>`}
  <//>`;
}

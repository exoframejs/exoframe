import { executeLogin as executeExoLogin } from 'exoframe-client';
import { useEffect, useMemo, useState } from 'react';
import { getConfig, updateConfig } from '../../config/index.js';

async function executeLogin({ endpoint, username, keyPath, passphrase, setError, setLoading, setLoginResponse }) {
  setLoading(true);
  // send login request
  try {
    const user = { username };
    const { token } = await executeExoLogin({
      endpoint,
      keyPath,
      username,
      passphrase,
    });
    updateConfig({ token, user });
    setLoginResponse('Successfully logged in!');
  } catch (e) {
    setError(`Check your username and password and try again.
    ${e.toString()}
    ${e.response ? JSON.stringify(e.response, null, 2) : ''}
    `);
  }
}

export const useLogin = ({ key, passphrase, url, username }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();
  const [loginResponse, setLoginResponse] = useState();

  // get config
  const config = useMemo(() => getConfig(), []);

  // generate login url
  const endpoint = useMemo(() => url ?? config.endpoint, [url, config]);

  // login once all params are set
  useEffect(() => {
    if (endpoint?.length > 0 && username?.length > 0 && key?.length > 0) {
      executeLogin({
        endpoint,
        username,
        keyPath: key,
        passphrase,
        setError,
        setLoading,
        setLoginResponse,
      });
    }
  }, [endpoint, username, key, passphrase, setError, setLoading, setLoginResponse]);

  return { loading, error, loginResponse };
};

import { readFile } from 'fs/promises';
import got from 'got';
import { useEffect, useMemo, useState } from 'react';
import sshpk from 'sshpk';
import { getConfig, updateConfig } from '../../config/index.js';

async function getLoginRequest({ remoteUrl, setError, setLoading, setLoginRequest }) {
  // get login request phrase and ID from server
  setLoading(true);
  try {
    const { body } = await got(remoteUrl, { responseType: 'json' });
    const phrase = body.phrase;
    const loginReqId = body.uid;
    if (!phrase || !loginReqId) {
      setError('Error getting login request phrase. Server did not return correct values!');
      return;
    }
    setLoginRequest({ phrase, loginReqId });
  } catch (e) {
    setError(`Error getting login request phrase. Make sure your endpoint is correct!\n${e.toString()}`);
  } finally {
    setLoading(false);
  }
}

async function generateSignature({ keyPath, passphrase, loginPhrase }) {
  const key = await readFile(keyPath);
  const pKey = sshpk.parsePrivateKey(key, 'auto', { passphrase });
  const signer = pKey.createSign('sha512');
  signer.update(loginPhrase);
  const signature = signer.sign();
  if (pKey.type === 'ed25519') {
    return signature.toString('asn1');
  }
  return signature.toBuffer();
}

async function executeLogin({
  remoteUrl,
  loginRequest,
  username,
  keyPath,
  passphrase,
  setError,
  setLoading,
  setLoginResponse,
}) {
  setLoading(true);
  // generate login token based on phrase from server
  let signature;
  try {
    signature = await generateSignature({ keyPath, passphrase, loginPhrase: loginRequest.phrase });
  } catch (e) {
    setError(`Error generating login token! Make sure your private key password is correct.\n${e.toString()}`);
    setLoading(false);
    return;
  }

  if (!signature) {
    setError('Error generating login signature! Something went wrong, please try again.');
    setLoading(false);
    return;
  }

  // send login request
  try {
    const user = { username };
    const { body } = await got(remoteUrl, {
      method: 'POST',
      json: {
        user,
        signature,
        requestId: loginRequest.loginReqId,
      },
      responseType: 'json',
    });
    // check for errors
    if (!body || !body.token) {
      throw new Error('Error logging in!');
    }
    updateConfig({ ...body, user });
    setLoginResponse('Successfully logged in!');
  } catch (e) {
    setError(`Check your username and password and try again.
    ${e.toString()}
    ${JSON.stringify(e.response.body, null, 2)}
    `);
  }
}

export const useLogin = ({ key, passphrase, url, username }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();
  const [loginResponse, setLoginResponse] = useState();
  const [loginRequest, setLoginRequest] = useState();

  // get config
  const config = useMemo(() => getConfig(), []);

  // generate login url
  const remoteUrl = useMemo(() => `${url ?? config.endpoint}/login`, [url, config]);

  // get login request once key, passphrase and url are set
  useEffect(() => {
    if (key?.length > 0 && passphrase?.length > 0 && username?.length > 0) {
      getLoginRequest({ remoteUrl, setError, setLoading, setLoginRequest });
    }
  }, [key, passphrase, username, remoteUrl, setError, setLoading, setLoginRequest]);

  // login once login request is set
  useEffect(() => {
    if (loginRequest) {
      executeLogin({
        remoteUrl,
        loginRequest,
        username,
        keyPath: key,
        passphrase,
        setError,
        setLoading,
        setLoginResponse,
      });
    }
  }, [loginRequest, remoteUrl, setError, setLoading, setLoginResponse]);

  return { loading, error, loginResponse };
};

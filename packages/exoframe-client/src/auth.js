import { readFile } from 'fs/promises';
import got from 'got';
import sshpk from 'sshpk';

/**
 * Generate a signature using private key
 * @param {object} params
 * @param {string} params.keyPath - path to private key
 * @param {string} [params.passphrase] - passphrase for the given key (if set)
 * @param {string} params.loginPhrase - phrase to use for the generation of signature
 * @returns {Promise<string | Buffer>} returns signature as a string of buffer
 */
export async function generateSignature({ keyPath, passphrase, loginPhrase }) {
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

/**
 * Get login request
 * @param {object} params
 * @param {string} params.endpoint - exoframe server endpoint
 * @returns {Promise<{phrase: string, loginReqId: string}>} returns login request phrase and login request id
 */
export const getLoginRequest = async ({ endpoint }) => {
  const remoteUrl = `${endpoint}/login`;
  const { body } = await got(remoteUrl, { responseType: 'json' });
  const phrase = body.phrase;
  const loginReqId = body.uid;
  if (!phrase || !loginReqId) {
    throw new Error('Error getting login request phrase. Server did not return correct values!');
  }
  return { phrase, loginReqId };
};

/**
 * Execute login with given loginRequest
 * @param {object} params
 * @param {string} params.endpoint - exoframe server endpoint
 * @param {string} params.username - username to use for login
 * @param {string} params.keyPath - path to private key to login with
 * @param {string} [params.passphrase] - passphrase for the given key (if set)
 * @param {{phrase: string, loginReqId: string}} params.loginRequest - login request from server
 * @returns {Promise<{token: string}>} returns JWT token from server on successful login
 */
export const loginWithLoginRequest = async ({ endpoint, username, keyPath, passphrase, loginRequest }) => {
  const remoteUrl = `${endpoint}/login`;

  // generate login token based on phrase from server
  const signature = await generateSignature({ keyPath, passphrase, loginPhrase: loginRequest.phrase });

  if (!signature) {
    throw new Error('Error generating login signature! Something went wrong, please try again.');
  }

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

  return body;
};

/**
 * Execute full login procedure
 * @param {object} params
 * @param {string} params.endpoint - exoframe server endpoint
 * @param {string} params.username - username to use for login
 * @param {string} params.keyPath - path to private key to login with
 * @param {string} [params.passphrase] - passphrase for the given key (if set)
 * @returns {Promise<{token: string}>} returns JWT token from server on successful login
 */
export const executeLogin = async ({ endpoint, username, keyPath, passphrase }) => {
  const loginRequest = await getLoginRequest({ endpoint });
  const loginResult = await loginWithLoginRequest({
    endpoint,
    loginRequest,
    username,
    keyPath,
    passphrase,
  });
  return loginResult;
};

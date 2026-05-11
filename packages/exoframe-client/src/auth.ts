import { readFile } from 'fs/promises';
import got from 'got';
import sshpk from 'sshpk';
import type { LoginRequest, LoginResponse } from './types.ts';

interface SignatureParams {
  keyPath: string;
  passphrase?: string;
  loginPhrase: string;
}

interface LoginParams {
  endpoint: string;
}

interface LoginWithRequestParams extends LoginParams {
  username: string;
  keyPath: string;
  passphrase?: string;
  loginRequest: LoginRequest;
}

export async function generateSignature({ keyPath, passphrase, loginPhrase }: SignatureParams): Promise<string | Buffer> {
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

export const getLoginRequest = async ({ endpoint }: LoginParams): Promise<LoginRequest> => {
  const remoteUrl = `${endpoint}/login`;
  const { body } = await got.get<{ phrase?: string; uid?: string }>(remoteUrl, { responseType: 'json' });
  const phrase = body.phrase;
  const loginReqId = body.uid;
  if (!phrase || !loginReqId) {
    throw new Error('Error getting login request phrase. Server did not return correct values!');
  }
  return { phrase, loginReqId };
};

export const loginWithLoginRequest = async ({
  endpoint,
  username,
  keyPath,
  passphrase,
  loginRequest,
}: LoginWithRequestParams): Promise<LoginResponse> => {
  const remoteUrl = `${endpoint}/login`;
  const signature = await generateSignature({ keyPath, passphrase, loginPhrase: loginRequest.phrase });

  if (!signature) {
    throw new Error('Error generating login signature! Something went wrong, please try again.');
  }

  const { body } = await got.post<LoginResponse>(remoteUrl, {
    json: {
      user: { username },
      signature,
      requestId: loginRequest.loginReqId,
    },
    responseType: 'json',
  });

  if (!body?.token) {
    throw new Error('Error logging in!');
  }

  return body;
};

export const executeLogin = async ({
  endpoint,
  username,
  keyPath,
  passphrase,
}: Omit<LoginWithRequestParams, 'loginRequest'>): Promise<LoginResponse> => {
  const loginRequest = await getLoginRequest({ endpoint });
  return loginWithLoginRequest({
    endpoint,
    loginRequest,
    username,
    keyPath,
    passphrase,
  });
};

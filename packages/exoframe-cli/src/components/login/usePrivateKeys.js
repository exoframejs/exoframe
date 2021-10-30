import { readdir } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';
import { useEffect, useState } from 'react';

export function usePrivateKeys({ skipLoad = false }) {
  const [error, setError] = useState();
  const [privateKeys, setPrivateKeys] = useState();

  useEffect(() => {
    async function getKeys() {
      if (skipLoad) {
        return;
      }
      // get user private keys
      const sshFolder = join(homedir(), '.ssh');
      try {
        const allFiles = await readdir(sshFolder);
        const filterOut = ['authorized_keys', 'config', 'known_hosts'];
        const privateKeys = allFiles.filter((f) => !f.endsWith('.pub') && !filterOut.includes(f));
        setPrivateKeys(privateKeys.map((key) => ({ label: key, value: `${sshFolder}/${key}` })));
      } catch (e) {
        setError('Default folder (~/.ssh) with private keys does not exists!');
      }
    }
    getKeys();
  }, [skipLoad, setError, setPrivateKeys]);

  return { error, privateKeys };
}

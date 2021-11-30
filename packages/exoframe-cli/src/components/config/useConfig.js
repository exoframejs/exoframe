import { readFile, stat } from 'fs/promises';
import set from 'lodash/set.js';
import path from 'path';
import { useEffect, useMemo, useState } from 'react';
import { writeConfig } from './writeConfig.js';

const defaultConfig = {
  domain: '',
  port: '',
  project: '',
  restart: '',
  env: undefined,
  labels: undefined,
  hostname: '',
  template: '',
  compress: undefined,
  letsencrypt: undefined,
  /* rateLimit: {
    average: 1,
    burst: 5,
  }, */
  basicAuth: false,
};

const loadConfig = async ({ configPath, setStatus, setError, setConfig }) => {
  setStatus('loading');
  try {
    await stat(configPath);
    const cfg = (await readFile(configPath)).toString();
    setStatus('exists');
    setConfig(JSON.parse(cfg));
  } catch (e) {
    // check if config didn't exist
    if (e.message.includes('ENOENT')) {
      setStatus('new');
    } else {
      // if there was any parsing error - show message and die
      setError('Error parsing existing config! Please make sure it is valid and try again.');
    }
  }
};

export const useConfig = () => {
  const [error, setError] = useState();
  const [status, setStatus] = useState('init');

  // construct paths for current project
  const { configPath, folderName } = useMemo(() => {
    const workdir = process.cwd();
    const folderName = path.basename(workdir);
    const configPath = path.join(process.cwd(), 'exoframe.json');
    return { configPath, folderName };
  }, []);

  const [config, setConfig] = useState(() => ({
    name: folderName,
    ...defaultConfig,
  }));

  const saveConfig = async () => {
    await writeConfig(configPath, { ...defaultConfig, ...config });
    setStatus('saved');
  };

  const updateConfig = (prop, value) => {
    setConfig((c) => set({ ...c }, prop, value));
  };

  const overrideConfigWith = async ({ domain, port, name, project, restart, hostname }) => {
    const overrideFromArgument = (key, value) => {
      if (!value) return;
      config[key] = value;
    };

    overrideFromArgument('domain', domain);
    overrideFromArgument('port', port);
    overrideFromArgument('name', name);
    overrideFromArgument('project', project);
    overrideFromArgument('restart', restart);
    overrideFromArgument('hostname', hostname);
    saveConfig();
  };

  useEffect(() => {
    if (!configPath) {
      return;
    }

    loadConfig({ configPath, setConfig, setError, setStatus });
  }, [configPath]);

  return { config, status, error, overrideConfigWith, updateConfig, saveConfig };
};

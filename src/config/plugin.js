// npm packages
import {join} from 'path';
import {statSync} from 'fs';
import {execSync} from 'child_process';

const rootFolder = join(__dirname, '..', '..');

const installNodeModule = ({name, module, update}) => {
  try {
    const modulePath = join(rootFolder, 'node_modules', name);
    statSync(modulePath);
    // if requested - trigger npm update
    if (update) {
      console.log('Updating plugin:', name);
      execSync(`cd ${rootFolder} && npm update ${module}`);
    }
  } catch (e) {
    console.log('Installing missing plugin:', name);
    execSync(`cd ${rootFolder} && npm install ${module}`);
  }
};

export default async (config, {update} = {}) => {
  if (!config.plugins) {
    return;
  }

  const pluginTypes = Object.keys(config.plugins);
  await Promise.all(pluginTypes.map(type => {
    const pluginsToInstall = config.plugins[type];
    return Promise.all(
      pluginsToInstall.map(plugin => {
        if (typeof plugin === 'object') {
          const name = Object.keys(plugin)[0];
          const module = plugin[name];
          return {module, name, update};
        }

        return {module: plugin, name: plugin, update};
      })
      .map(plugin => installNodeModule(plugin))
    );
  }));
};

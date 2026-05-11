import { homedir } from 'os';
import { join } from 'path';

const xdgConfigHome = process.env.XDG_CONFIG_HOME || join(homedir(), '.config');

export const baseFolder = join(xdgConfigHome, 'exoframe');
export const configPath = join(baseFolder, 'server.config.yml');
export const publicKeysPath = join(homedir(), '.ssh');
export const extensionsFolder = join(baseFolder, 'extensions');
export const recipesFolder = join(baseFolder, 'recipes');
export const tempDockerDir = join(baseFolder, 'deploying');
export const logFolder = join(xdgConfigHome, 'exoframe', 'exoframe-server');

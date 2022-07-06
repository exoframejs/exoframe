import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

export const baseFolder = dirname(fileURLToPath(import.meta.url));
export const fixturesFolder = join(baseFolder, '..', 'fixtures');
export const testFolder = join(fixturesFolder, 'config-test');

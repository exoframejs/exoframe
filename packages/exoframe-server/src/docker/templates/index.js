/* eslint global-require: off */
/* eslint import/no-dynamic-require: off */
// npm packages
import { template as faasTemplate } from 'exoframe-faas';
import { readFileSync } from 'fs';
import { join } from 'path';
import { extensionsFolder } from '../../config/index.js';
import * as composeTemplate from './compose.js';
import * as dockerfileTemplate from './dockerfile.js';
import * as imageTemplate from './image.js';
import * as nodeTemplate from './node.js';
import * as staticTemplate from './static.js';

// load 3rd party templates
export default () => {
  const packagePath = join(extensionsFolder, 'package.json');
  const packageString = readFileSync(packagePath).toString();
  const packageJSON = JSON.parse(packageString);
  const userTemplateNames = Object.keys(packageJSON.dependencies || {});
  const userTemplates = userTemplateNames.map((templateName) => {
    const templatePath = join(extensionsFolder, 'node_modules', templateName);
    return require(templatePath);
  });

  return [faasTemplate, imageTemplate, composeTemplate, dockerfileTemplate, nodeTemplate, staticTemplate].concat(
    userTemplates
  );
};

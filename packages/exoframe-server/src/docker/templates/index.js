// npm packages
import { readFileSync } from 'fs';
import { join } from 'path';
import { extensionsFolder } from '../../config/paths.js';
import * as dockerfileTemplate from './dockerfile.js';
import * as imageTemplate from './image.js';
import * as nodeTemplate from './node.js';
import * as staticTemplate from './static.js';

// load 3rd party templates
export default async () => {
  const packagePath = join(extensionsFolder, 'package.json');
  const packageString = readFileSync(packagePath).toString();
  const packageJSON = JSON.parse(packageString);
  const userTemplateNames = Object.keys(packageJSON.dependencies || {});
  const userTemplates = await Promise.all(
    userTemplateNames.map((templateName) => {
      const templatePath = join(extensionsFolder, 'node_modules', templateName);
      return import(templatePath);
    })
  );

  return [imageTemplate, dockerfileTemplate, nodeTemplate, staticTemplate].concat(userTemplates);
};

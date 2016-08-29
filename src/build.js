// npm packages
import fs from 'fs';
import got from 'got';
import tar from 'tar-fs';
import path from 'path';
import chalk from 'chalk';

// our packages
import config from './config';
import {dockerignore} from './docker';


const dockerfileTemplate = `
FROM node:onbuild
`;

// text cleanup
const cleanText = (txt) => txt.trim().replace(/[\n\r]/g, '');

export default (yargs) =>
  yargs.command('build [endpoint]', 'build current folder using exoframe server', {
    tag: {
      alias: 't',
    },
    endpoint: {
      default: config.endpoint,
    },
  }, ({endpoint, tag}) => {
    console.log(chalk.bold('Building current folder using endpoint:'), endpoint);
    // create config vars
    const baseUrl = `${endpoint.replace(/\/$/, '')}/api/build`;
    const workdir = process.cwd();
    const buildTag = tag || workdir.split('/').pop().trim();
    const dockerfilePath = path.join(workdir, 'Dockerfile');
    const remoteUrl = `${baseUrl}?tag=${encodeURIComponent(buildTag)}`;

    // check if dockerfile already exists
    let deleteDockerfile = false;
    try {
      fs.accessSync(dockerfilePath);
    } catch (e) {
      // if no - write new dockerfile
      fs.writeFileSync(dockerfilePath, dockerfileTemplate, 'utf8');
      // say we need to delete dockerfile later
      deleteDockerfile = true;
    }

    // create tar stream from current folder
    const tarStream = tar.pack(workdir, {ignore: dockerignore()});

    // pipe stream to remote
    const stream = tarStream.pipe(got.stream.post(remoteUrl));
    stream.on('data', (str) => {
      const text = str.toString().split('\n');
      text.filter(t => t && t.length).forEach(t => {
        try {
          const data = JSON.parse(t);
          console.log(cleanText(data.stream));
        } catch (e) {
          console.log(cleanText(t));
        }
      });
    });
    stream.on('end', () => {
      if (deleteDockerfile) {
        fs.unlinkSync(dockerfilePath);
      }
      console.log(chalk.bold('Done building!'), `Your images is now available as ${buildTag}`);
    });
  });

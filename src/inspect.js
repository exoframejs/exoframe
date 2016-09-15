// npm packages
import chalk from 'chalk';
import got from 'got';
import inquirer from 'inquirer';

// our packages
import config, {isLoggedIn} from './config';
import {handleError} from './error';
import {getServices} from './list';

const command = 'inspect [service]';
const describe = 'inspect service on exoframe server';
const builder = {
  service: {
    alias: 's',
  },
};
const handler = async ({service}) => {
  if (!isLoggedIn()) {
    return;
  }

  // log header
  console.log(chalk.bold('Inspecting service on:'), config.endpoint);
  console.log();
  if (!service) {
    console.log('No service given, fetching list...');
  }

  try {
    // try sending request
    const allServices = await getServices();
    const services = allServices
      .map(svc => ({...svc, name: svc.Names[0].replace(/^\//, '')}));
    if (services.length > 0) {
      let svcToInspect;
      if (!service) {
        console.log(chalk.green('Available services:'));
        // ask for restart policy and retries count when applicable
        const {serviceId} = await inquirer.prompt({
          type: 'list',
          name: 'serviceId',
          message: 'Inspect service:',
          choices: services,
        });
        svcToInspect = services.find(svc => svc.name === serviceId);
      } else {
        svcToInspect = services.find(svc => svc.Id.slice(0, 12) === service);
      }
      // stop
      console.log(chalk.bold('Getting logs for:'), svcToInspect.name);
      // send request to stop
      const inspectUrl = `${config.endpoint}/api/inspect/${svcToInspect.Id.slice(0, 12)}`;
      // construct shared request params
      const options = {
        headers: {
          'x-access-token': config.token,
        },
        // json: true,
      };
      // try sending request
      const {body: bodyString} = await got(inspectUrl, options);
      // check for errors
      if (!bodyString || !bodyString.length) {
        throw new Error('Error inspecting!');
      }
      const body = JSON.parse(bodyString);
      console.log(chalk.green('Service info:'));
      // format inspect data
      console.log(`  ${chalk.bold('Id:')} ${body.Id.slice(0, 12)}`);
      console.log(`  ${chalk.bold('Command:')} ${body.Path} ${body.Args.join(' ')}`);
      console.log(`  ${chalk.bold('State:')} ${body.State.Status}`);
      if (body.State.Status !== 'running') {
        console.log(`    - ${chalk.bold('Exit Code:')} ${body.State.ExitCode}`);
        console.log(`    - ${chalk.bold('Error:')} ${body.State.Error}`);
      }
      console.log(`    - ${chalk.bold('Started At:')} ${new Date(body.State.StartedAt)}`);
      if (body.State.Status !== 'running') {
        console.log(`    - ${chalk.bold('Finished At:')} ${new Date(body.State.FinishedAt)}`);
      }
      console.log(`  ${chalk.bold('Name:')} ${body.Name.replace(/^\//, '')}`);
      console.log(`  ${chalk.bold('Restart Policy:')} ${body.HostConfig.RestartPolicy.Name}`);
      console.log(`  ${chalk.bold('Restart Count:')} ${body.RestartCount}`);
      // labels
      console.log(`  ${chalk.bold('Labels:')}`);
      Object.keys(body.Config.Labels).forEach(label => {
        console.log(`    - ${label}: ${body.Config.Labels[label]}`);
      });
      // volumes
      console.log(`  ${chalk.bold('Volumes:')}`);
      body.HostConfig.Binds.forEach(vol => {
        console.log(`    - ${vol}`);
      });
      // env vars
      console.log(`  ${chalk.bold('Environmental variables:')}`);
      body.Config.Env.forEach(env => {
        console.log(`    - ${env}`);
      });
      // ports
      console.log(`  ${chalk.bold('Port mappings:')}`);
      Object.keys(body.NetworkSettings.Ports)
      .filter(clientPort => body.NetworkSettings.Ports[clientPort])
      .forEach(clientPort => {
        console.log(`    - Container ${clientPort} to`);
        body.NetworkSettings.Ports[clientPort].forEach(hostPort => {
          console.log(`      > host ${hostPort.HostPort}`);
        });
      });
    } else {
      console.log(chalk.green('No services found!'));
    }
  } catch (e) {
    // try generic error handling first
    if (handleError(e)) {
      return;
    }

    // output error message and log error
    console.log(chalk.red('Error getting services for inspection!'));
    console.error(e);
  }
};

export default {
  command,
  describe,
  builder,
  handler,
};

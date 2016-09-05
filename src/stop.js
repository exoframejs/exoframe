// npm packages
import chalk from 'chalk';
import got from 'got';
import inquirer from 'inquirer';

// our packages
import config from './config';
import {handleError} from './error';
import {getServices} from './list';

export default (yargs) =>
  yargs.command('stop [service]', 'stop running service on exoframe server', {
    service: {
      alias: 's',
    },
  }, async ({service}) => {
    // log header
    console.log(chalk.bold('Stopping service on:'), config.endpoint);
    console.log();
    if (!service) {
      console.log('No service given, fetching list...');
    }

    try {
      // try sending request
      const allServices = await getServices();
      const services = allServices
        .filter(svc => svc.Status.toLowerCase().includes('up'))
        .map(svc => ({...svc, name: svc.Names[0].replace(/^\//, '')}));
      if (services.length > 0) {
        let svcToStop;
        if (!service) {
          console.log(chalk.green('Running services:'));
          // ask for restart policy and retries count when applicable
          const {serviceId} = await inquirer.prompt({
            type: 'list',
            name: 'serviceId',
            message: 'Service to stop:',
            choices: services,
          });
          svcToStop = services.find(svc => svc.name === serviceId);
        } else {
          svcToStop = services.find(svc => svc.Id.slice(0, 12) === service);
        }
        // stop
        console.log(chalk.bold('Stopping..'));
        // send request to stop
        const stopUrl = `${config.endpoint}/api/stop/${svcToStop.Id.slice(0, 12)}`;
        // construct shared request params
        const options = {
          headers: {
            'x-access-token': config.token,
          },
          json: true,
        };
        // try sending request
        const {statusCode} = await got.post(stopUrl, options);
        if (statusCode === 204) {
          console.log(chalk.green('Service stopped!'));
        } else {
          console.log(chalk.red('Error!'), 'Could not stop the service.');
        }
      } else {
        console.log(chalk.green('No running services found!'));
      }
    } catch (e) {
      // try generic error handling first
      if (handleError(e)) {
        return;
      }

      // output error message and log error
      console.log(chalk.red('Error getting images or services!'));
      console.error(e);
    }
  });

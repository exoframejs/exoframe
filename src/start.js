// npm packages
import chalk from 'chalk';
import got from 'got';
import inquirer from 'inquirer';

// our packages
import config, {isLoggedIn} from './config';
import {handleError} from './error';
import {getServices} from './list';

export default (yargs) =>
  yargs.command('start [service]', 'start non-running service on exoframe server', {
    service: {
      alias: 's',
    },
  }, async ({service}) => {
    if (!isLoggedIn()) {
      return;
    }

    // log header
    console.log(chalk.bold('Starting service on:'), config.endpoint);
    console.log();
    if (!service) {
      console.log('No service given, fetching list...');
    }

    try {
      // try sending request
      const allServices = await getServices();
      const services = allServices
        .filter(svc => !svc.Status.toLowerCase().includes('up'))
        .map(svc => ({...svc, name: svc.Names[0].replace(/^\//, '')}));
      if (services.length > 0) {
        let svcToStart;
        if (!service) {
          console.log(chalk.green('Non-running services:'));
          // ask for restart policy and retries count when applicable
          const {serviceId} = await inquirer.prompt({
            type: 'list',
            name: 'serviceId',
            message: 'Service to start:',
            choices: services,
          });
          svcToStart = services.find(svc => svc.name === serviceId);
        } else {
          svcToStart = services.find(svc => svc.Id.slice(0, 12) === service);
        }
        // stop
        console.log(chalk.bold('Starting:'), svcToStart.name);
        // send request to remove
        const startUrl = `${config.endpoint}/api/start/${svcToStart.Id.slice(0, 12)}`;
        // construct shared request params
        const options = {
          headers: {
            'x-access-token': config.token,
          },
          json: true,
        };
        // try sending request
        const {statusCode} = await got.post(startUrl, options);
        if (statusCode === 204) {
          console.log(chalk.green('Service started!'));
        } else {
          console.log(chalk.red('Error!'), 'Could not start the service.');
        }
      } else {
        console.log(chalk.green('No non-running services found!'));
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

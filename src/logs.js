// npm packages
import chalk from 'chalk';
import got from 'got';
import inquirer from 'inquirer';

// our packages
import config, {isLoggedIn} from './config';
import {handleError} from './error';
import {getServices} from './list';

export default (yargs) =>
  yargs.command('logs [service]', 'get logs for running service on exoframe server', {
    service: {
      alias: 's',
    },
  }, async ({service}) => {
    if (!isLoggedIn()) {
      return;
    }

    // log header
    console.log(chalk.bold('Getting logs for service on:'), config.endpoint);
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
        let svcToLog;
        if (!service) {
          console.log(chalk.green('Running services:'));
          // ask for restart policy and retries count when applicable
          const {serviceId} = await inquirer.prompt({
            type: 'list',
            name: 'serviceId',
            message: 'Logs for service:',
            choices: services,
          });
          svcToLog = services.find(svc => svc.name === serviceId);
        } else {
          svcToLog = services.find(svc => svc.Id.slice(0, 12) === service);
        }
        // stop
        console.log(chalk.bold('Getting logs for:'), svcToLog.name);
        // send request to stop
        const logUrl = `${config.endpoint}/api/logs/${svcToLog.Id.slice(0, 12)}`;
        // construct shared request params
        const options = {
          headers: {
            'x-access-token': config.token,
          },
        };
        // try sending request
        const logStream = got.stream(logUrl, options);
        logStream.on('error', e => {
          // try generic error handling first
          if (handleError(e)) {
            return;
          }

          console.log(chalk.red('Error getting logs!'));
          console.error(e);
        });
        logStream.on('data', buf => {
          const d = buf.toString().replace(/\n$/, '');
          console.log(d);
        });
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

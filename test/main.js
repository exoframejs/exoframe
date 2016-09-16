// npm packages
import test from 'tape';
import chalk from 'chalk';

// our packages
import {startServer, stopServer} from './fixtures/server';
// import '../src/index';

// tests
import loginTest from './login';
import endpointTest from './endpoint';
import statusTest from './status';
import updateTest from './update';
import buildTest from './build';
import deployTest from './deploy';
import cleanTest from './clean';
import stopTest from './stop';
import startTest from './start';
import removeTest from './remove';
import inspectTest from './inspect';

// disable chalk
chalk.enabled = false;

// start server before running tests
test('Start server', (t) => {
  startServer(t.end);
});

// run tests
endpointTest(test);
loginTest(test);
statusTest(test);
updateTest(test);
buildTest(test);
deployTest(test);
cleanTest(test);
stopTest(test);
startTest(test);
removeTest(test);
inspectTest(test);

// stop server in the end
test('Stop server', (t) => {
  stopServer(t.end);
});

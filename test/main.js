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
import cleanTest from './clean';

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
cleanTest(test);

// stop server in the end
test('Stop server', (t) => {
  stopServer(t.end);
});

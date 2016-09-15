// npm packages
import test from 'tape';

// our packages
import {startServer, stopServer} from './fixtures/server';

// tests
import loginTest from './login';

// start server before running tests
test('Start server', (t) => {
  startServer(() => t.end());
});

// run tests
loginTest(test);

// stop server in the end
test('Stop server', (t) => {
  stopServer(() => t.end());
});

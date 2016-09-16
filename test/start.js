// npm packages
import inquirer from 'inquirer';
import sinon from 'sinon';

// our packages
import app, {services} from './fixtures/server';
import {sleep} from './fixtures/util';
import start from '../src/start';

export default (test) => {
  // test
  test('Should send correct start request', (t) => {
    const serviceId = services[1].Names[0];
      // stup inquirer answer
    sinon.stub(inquirer, 'prompt', () => Promise.resolve({serviceId}));
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');

    // stub server api
    app.post('/api/start/:id', async (req, res) => {
      // send response
      res.sendStatus(204);

      await sleep(100);
      // make sure log in was successful
      // first check console output
      t.deepEqual(consoleSpy.args, [
        ['Starting service on:', 'http://localhost:3000'],
        [],
        ['No service given, fetching list...'],
        ['Non-running services:'],
        ['Starting:', 'test-stopped'],
        ['Service started!'],
      ], 'Correct log output');
      t.equal(req.headers['x-access-token'], 'test-token-123', 'Correct token');
      t.equal(req.params.id, services[1].Id.slice(0, 12), 'Correct service ID');

      // restore console
      console.log.restore();
      // restore inquirer
      inquirer.prompt.restore();
      t.end();
    });

    // execute change
    start.handler({});
  });
};

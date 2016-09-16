// npm packages
import inquirer from 'inquirer';
import sinon from 'sinon';

// our packages
import app, {services} from './fixtures/server';
import {sleep} from './fixtures/util';
import logs from '../src/logs';

export default (test) => {
  // test
  test('Should get service logs', (t) => {
    const serviceId = services[1].Names[0];
      // stup inquirer answer
    sinon.stub(inquirer, 'prompt', () => Promise.resolve({serviceId}));
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');

    // stub server api
    app.get('/api/logs/:id', async (req, res) => {
      // send response
      res.send('Logs here..')

      await sleep(100);
      // make sure log in was successful
      // first check console output
      t.deepEqual(consoleSpy.args, [
        ['Getting logs for service on:', 'http://localhost:3000'],
        [],
        ['No service given, fetching list...'],
        ['Running services:'],
        ['Getting logs for:', 'test-stopped'],
        ['Logs here..'],
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
    logs.handler({});
  });
};

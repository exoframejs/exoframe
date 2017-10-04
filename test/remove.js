// npm packages
const tap = require('tap');
const nock = require('nock');
const sinon = require('sinon');

// our packages
const {handler: remove} = require('../src/commands/remove');
const {userConfig, updateConfig} = require('../src/config');

module.exports = () => {
  const id = 'test-id';

  // test removal
  tap.test('Should remove', t => {
    // handle correct request
    const rmServer = nock('http://localhost:8080')
      .post(`/remove/${id}`)
      .reply(204);
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');
    // execute login
    remove({id}).then(() => {
      // make sure log in was successful
      // check that server was called
      t.ok(rmServer.isDone());
      // first check console output
      t.deepEqual(consoleSpy.args, [['Removing deployment:', id], ['Deployment removed!']], 'Correct log output');
      // restore console
      console.log.restore();
      rmServer.done();
      t.end();
    });
  });

  // test removal error
  tap.test('Should show remove error', t => {
    // handle correct request
    const rmServer = nock('http://localhost:8080')
      .post(`/remove/${id}`)
      .reply(500);
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');
    // execute login
    remove({id}).then(() => {
      // make sure log in was successful
      // check that server was called
      t.ok(rmServer.isDone());
      // first check console output
      t.deepEqual(
        consoleSpy.args,
        [
          ['Removing deployment:', id],
          ['Error removing project:', 'HTTPError: Response code 500 (Internal Server Error)'],
        ],
        'Correct log output'
      );
      // restore console
      console.log.restore();
      rmServer.done();
      t.end();
    });
  });

  // test removal error
  tap.test('Should show not found error', t => {
    // handle correct request
    const rmServer = nock('http://localhost:8080')
      .post(`/remove/${id}`)
      .reply(404);
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');
    // execute login
    remove({id}).then(() => {
      // make sure log in was successful
      // check that server was called
      t.ok(rmServer.isDone());
      // first check console output
      t.deepEqual(
        consoleSpy.args,
        [
          ['Removing deployment:', id],
          ['Error: container was not found!', 'Please, check deployment ID and try again.'],
        ],
        'Correct log output'
      );
      // restore console
      console.log.restore();
      rmServer.done();
      t.end();
    });
  });

  // test removal error on incorrect success code
  tap.test('Should show not found error', t => {
    // handle correct request
    const rmServer = nock('http://localhost:8080')
      .post(`/remove/${id}`)
      .reply(200);
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');
    // execute login
    remove({id}).then(() => {
      // make sure log in was successful
      // check that server was called
      t.ok(rmServer.isDone());
      // first check console output
      t.deepEqual(
        consoleSpy.args,
        [['Removing deployment:', id], ['Error!', 'Could not remove the deployment.']],
        'Correct log output'
      );
      // restore console
      console.log.restore();
      rmServer.done();
      t.end();
    });
  });

  // test
  tap.test('Should deauth on 401', t => {
    // copy original config for restoration
    const originalConfig = Object.assign({}, userConfig);
    // handle correct request
    const rmServer = nock('http://localhost:8080')
      .post(`/remove/${id}`)
      .reply(401);
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');
    // execute login
    remove({id}).then(() => {
      // make sure log in was successful
      // check that server was called
      t.ok(rmServer.isDone());
      // first check console output
      t.deepEqual(
        consoleSpy.args,
        [['Removing deployment:', id], ['Error: authorization expired!', 'Please, relogin and try again.']],
        'Correct log output'
      );
      // check config
      t.notOk(userConfig.user, 'Should not have user');
      t.notOk(userConfig.token, 'Should not have token');
      // restore console
      console.log.restore();
      // tear down nock
      rmServer.done();
      // restore original config
      updateConfig(originalConfig);
      t.end();
    });
  });
};

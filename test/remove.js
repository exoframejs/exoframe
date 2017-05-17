// npm packages
const tap = require('tap');
const nock = require('nock');
const sinon = require('sinon');

// our packages
const {handler: remove} = require('../src/commands/remove');

module.exports = () => {
  const id = 'test-id';

  // handle correct request
  const rmServer = nock('http://localhost:8080').post(`/remove/${id}`).reply(204);

  // test
  tap.test('Should remove', t => {
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
      t.end();
    });
  });
};

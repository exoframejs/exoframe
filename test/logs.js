// npm packages
const tap = require('tap');
const nock = require('nock');
const sinon = require('sinon');
const Stream = require('stream');

// our packages
const {handler: logs} = require('../src/commands/logs');
const {userConfig, updateConfig} = require('../src/config');

module.exports = () => {
  const id = 'test-id';
  const dirtyLogs = [
    '\u0001\u0000\u0000\u0000\u0000\u0000\u000022017-05-18T15:16:40.120990460Z yarn start v0.24.4',
    '\u0001\u0000\u0000\u0000\u0000\u0000\u000002017-05-18T15:16:40.212591019Z $ node index.js ',
    '\u0001\u0000\u0000\u0000\u0000\u0000\u000042017-05-18T15:16:40.375554362Z Listening on port 80',
    '',
  ];

  // test removal
  tap.test('Should get logs', t => {
    const readable = new Stream.Readable();
    const emitLogs = () => {
      dirtyLogs.forEach(item => readable.push(item));
      // no more data
      readable.push(null);
    };
    // handle correct request
    const logServer = nock('http://localhost:8080').get(`/logs/${id}`).reply(200, () => {
      emitLogs();
      return readable;
    });
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');
    // execute login
    logs({id}).then(() => {
      // make sure log in was successful
      // check that server was called
      t.ok(logServer.isDone());
      // first check console output
      t.deepEqual(
        consoleSpy.args,
        [
          ['Getting logs for deployment:', id],
          ['18/05/2017 17:16:40 yarn start v0.24.4'],
          ['18/05/2017 17:16:40 $ node index.js '],
          ['18/05/2017 17:16:40 Listening on port 80'],
        ],
        'Correct log output'
      );
      // restore console
      console.log.restore();
      logServer.done();
      t.end();
    });
  });
};

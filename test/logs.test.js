/* eslint-env jest */
// npm packages
const nock = require('nock');
const sinon = require('sinon');
const Stream = require('stream');

// our packages
const {cleanLogs} = require('./util');
const {handler: logs} = require('../src/commands/logs');

const id = 'test-id';
const date1 = '2017-05-18T15:16:40.120990460Z';
const date2 = '2017-05-18T15:16:40.212591019Z';
const date3 = '2017-05-18T15:16:40.375554362Z';
const dirtyLogs = [
  `\u0001\u0000\u0000\u0000\u0000\u0000\u0000g${date1} yarn start v0.24.4`,
  `\u0001\u0000\u0000\u0000\u0000\u0000\u0000${date2} $ node index.js `,
  `\u0001\u0000\u0000\u0000\u0000\u0000\u0000${date3} Listening on port 80`,
  '',
];

// test removal
test('Should get logs', done => {
  const readable = new Stream.Readable();
  const emitLogs = () => {
    dirtyLogs.forEach(item => readable.push(item));
    // no more data
    readable.push(null);
  };
  // handle correct request
  const logServer = nock('http://localhost:8080')
    .get(`/logs/${id}`)
    .reply(200, () => {
      emitLogs();
      return readable;
    });
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // execute login
  logs({id}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(logServer.isDone()).toBeTruthy();
    // first check console output
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const d3 = new Date(date3);
    const cleanedLogs = cleanLogs(consoleSpy.args);
    expect(cleanedLogs).toEqual([
      ['Getting logs for deployment:', id, '\n'],
      [`${d1.toLocaleDateString()} ${d1.toLocaleTimeString()} yarn start v0.24.4`],
      [`${d2.toLocaleDateString()} ${d2.toLocaleTimeString()} $ node index.js `],
      [`${d3.toLocaleDateString()} ${d3.toLocaleTimeString()} Listening on port 80`],
    ]);
    // restore console
    console.log.restore();
    logServer.done();
    done();
  });
});

import { expect, test } from '@jest/globals';
import nock from 'nock';
import Stream from 'stream';
import { getLogs } from '../index.js';

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
const endpoint = 'http://localhost:8080';
const token = 'test-123';

const consumeToEnd = (stream) =>
  new Promise((resolve, reject) => {
    const results = [];
    stream.on('error', (e) => reject(e));
    stream.on('end', () => resolve(results));
    stream.on('data', (item) => results.push(item));
  });

// test removal
test.only('Should get logs', async () => {
  const readable = new Stream.Readable();
  const emitLogs = () => {
    dirtyLogs.forEach((item) => readable.push(item));
    // no more data
    readable.push(null);
  };
  // handle correct request
  const logServer = nock(endpoint)
    .get(`/logs/${id}`)
    .reply(200, () => {
      emitLogs();
      return readable;
    });
  // execute login
  const logEventEmitter = await getLogs({ id, endpoint, token });
  const logs = await consumeToEnd(logEventEmitter);
  // make sure log in was successful
  // check that server was called
  expect(logServer.isDone()).toBeTruthy();
  // make sure logs are correct
  expect(logs).toMatchSnapshot();
  // close server
  logServer.done();
});

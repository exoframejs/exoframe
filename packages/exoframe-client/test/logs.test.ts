import { getLogs } from 'exoframe-client';
import nock from 'nock';
import Stream from 'stream';
import { setTimeout } from 'timers/promises';
import { expect, test } from 'vitest';

const IO_TIMEOUT = 50;

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

// test logs fetching
test('Should get logs', async () => {
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
  expect(logs).toMatchInlineSnapshot(`
    [
      {
        "date": "5/18/2017 3:16:40 PM",
        "msg": "yarn start v0.24.4",
      },
      {
        "date": "5/18/2017 3:16:40 PM",
        "msg": "$ node index.js ",
      },
      {
        "date": "5/18/2017 3:16:40 PM",
        "msg": "Listening on port 80",
      },
    ]
  `);
  // close server
  logServer.done();
});

test('Should throw on auth error', async () => {
  // handle correct request
  const logServer = nock(endpoint).get(`/logs/${id}`).reply(401);
  // execute login
  const logEventEmitter = await getLogs({ id, endpoint, token });
  logEventEmitter.on('error', (err) => expect(err).toMatchInlineSnapshot('[Error: Authorization expired!]'));
  // wait for IO
  await setTimeout(IO_TIMEOUT);
  // make sure log in was successful
  // check that server was called
  expect(logServer.isDone()).toBeTruthy();
  // close server
  logServer.done();
});

test('Should throw not found error', async () => {
  // handle correct request
  const logServer = nock(endpoint).get(`/logs/${id}`).reply(404);
  // execute login
  const logEventEmitter = await getLogs({ id, endpoint, token });
  logEventEmitter.on('error', (err) => expect(err).toMatchInlineSnapshot('[Error: Container was not found!]'));
  // wait for IO
  await setTimeout(IO_TIMEOUT);
  // make sure log in was successful
  // check that server was called
  expect(logServer.isDone()).toBeTruthy();
  // close server
  logServer.done();
});

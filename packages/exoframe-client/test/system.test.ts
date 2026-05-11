import { pruneSystem } from 'exoframe-client';
import nock from 'nock';
import { expect, test } from 'vitest';

const endpoint = 'http://localhost:8080';
const token = 'test-123';

test('Should execute prune', async () => {
  // handle correct request
  const pruneServer = nock(endpoint)
    .post('/system/prune')
    .reply(200, { pruned: true, data: [{ SpaceReclaimed: 1024 }] });
  // execute login
  const result = await pruneSystem({ endpoint, token });
  // make sure it was successful
  expect(result).toEqual({ prunedBytes: 1024 });
  // check that server was called
  expect(pruneServer.isDone()).toBeTruthy();
  // cleanup server
  pruneServer.done();
});

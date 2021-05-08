import { expect, test } from '@jest/globals';
import { addTemplate, listTemplates, removeTemplate } from 'exoframe-client';
import nock from 'nock';

const endpoint = 'http://localhost:8080';
const token = 'test-123';

test('Should install new template', async () => {
  // handle correct request
  const response = { success: 'true', log: ['1', '2', '3'] };
  const templateServer = nock(endpoint).post('/templates').reply(200, response);
  // execute template addition
  const result = await addTemplate({ template: 'test', endpoint, token });
  // make sure it was successful
  expect(result).toEqual(response);
  // check that server was called
  expect(templateServer.isDone()).toBeTruthy();
  // tear down nock
  templateServer.done();
});

test('Should list templates', async () => {
  // handle correct request
  const response = { template: '^0.0.1', otherTemplate: '^1.0.0' };
  const templateServer = nock(endpoint).get('/templates').reply(200, response);
  // execute template listing
  const result = await listTemplates({ endpoint, token });
  // make sure it was successful
  expect(result).toEqual(response);
  // check that server was called
  expect(templateServer.isDone()).toBeTruthy();
  // tear down nock
  templateServer.done();
});

test('Should remove template', async () => {
  // handle correct request
  const response = { removed: true, log: ['1', '2', '3'] };
  const templateServer = nock(endpoint).delete('/templates').reply(200, response);
  // execute template removal
  const result = await removeTemplate({ template: 'test', endpoint, token });
  // make sure it was successful
  expect(result).toEqual(response);
  // check that server was called
  expect(templateServer.isDone()).toBeTruthy();
  // tear down nock
  templateServer.done();
});

test('Should deauth on 401 on creation', async () => {
  // handle correct request
  const templateServer = nock(endpoint).post('/templates').reply(401);
  // execute template addition
  try {
    await addTemplate({ template: 'test', endpoint, token });
  } catch (err) {
    // make sure it errored out
    expect(err).toMatchInlineSnapshot(`[Error: Authorization expired!]`);
  }
  // check that server was called
  expect(templateServer.isDone()).toBeTruthy();
  // tear down nock
  templateServer.done();
});

test('Should deauth on 401 on list', async () => {
  // handle correct request
  const templateServer = nock(endpoint).get('/templates').reply(401);
  // execute template listing
  try {
    await listTemplates({ endpoint, token });
  } catch (err) {
    // make sure it errored out
    expect(err).toMatchInlineSnapshot(`[Error: Authorization expired!]`);
  }
  // check that server was called
  expect(templateServer.isDone()).toBeTruthy();
  // tear down nock
  templateServer.done();
});

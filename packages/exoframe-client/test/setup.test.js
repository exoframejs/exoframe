import { executeRecipe, getRecipeQuestions } from 'exoframe-client';
import nock from 'nock';
import { expect, test } from 'vitest';

// questions mock
const questions = [
  {
    type: 'input',
    name: 'test1',
    message: 'Test q1:',
  },
  {
    type: 'input',
    name: 'test2',
    message: 'Test q2:',
  },
];
const endpoint = 'http://localhost:8080';
const token = 'test-123';

test('Should get questions for recipe', async () => {
  const name = 'test';
  // handle correct request
  const setupServerGet = nock(endpoint)
    .get('/setup')
    .query({ recipeName: name })
    .reply(200, { success: 'true', questions, log: ['1', '2', '3'] });
  // stup inquirer answers
  const result = await getRecipeQuestions({ recipe: name, endpoint, token });
  // make sure log in was successful
  expect(result).toMatchInlineSnapshot(`
    {
      "log": [
        "1",
        "2",
        "3",
      ],
      "questions": [
        {
          "message": "Test q1:",
          "name": "test1",
          "type": "input",
        },
        {
          "message": "Test q2:",
          "name": "test2",
          "type": "input",
        },
      ],
    }
  `);
  // check that server was called
  expect(setupServerGet.isDone()).toBeTruthy();
  // tear down nock
  setupServerGet.done();
});

test('Should execute recipe', async () => {
  // handle correct request
  const setupServerPost = nock(endpoint)
    .post('/setup')
    .reply(200, {
      success: 'true',
      log: [
        { message: '1', level: 'info' },
        { message: '2', level: 'info' },
        { message: '3', level: 'debug' },
      ],
    });
  // stup inquirer answers
  const name = 'test';
  const answers = { test1: 'answer1', test2: 'answer2' };
  const result = await executeRecipe({ name, answers, endpoint, token });
  // make sure log in was successful
  expect(result).toMatchInlineSnapshot(`
    {
      "log": [
        {
          "level": "info",
          "message": "1",
        },
        {
          "level": "info",
          "message": "2",
        },
        {
          "level": "debug",
          "message": "3",
        },
      ],
    }
  `);
  // check that server was called
  expect(setupServerPost.isDone()).toBeTruthy();
  // tear down nock
  setupServerPost.done();
});

test('Should deauth on 401 on questions list', async () => {
  // handle correct request
  const setupServer = nock(endpoint).get('/setup').query(true).reply(401);
  // execute get recipe question
  try {
    await getRecipeQuestions({ recipe: 'test', endpoint, token });
  } catch (err) {
    expect(err).toMatchInlineSnapshot(`[Error: Authorization expired!]`);
  }
  // check that server was called
  expect(setupServer.isDone()).toBeTruthy();
  // tear down nock
  setupServer.done();
});

test('Should deauth on 401 on recipe execution', async () => {
  // handle correct request
  const setupServer = nock(endpoint).post('/setup').reply(401);
  // execute get recipe question
  try {
    await executeRecipe({ recipe: 'test', answers: [], endpoint, token });
  } catch (err) {
    expect(err).toMatchInlineSnapshot(`[Error: Authorization expired!]`);
  }
  // check that server was called
  expect(setupServer.isDone()).toBeTruthy();
  // tear down nock
  setupServer.done();
});

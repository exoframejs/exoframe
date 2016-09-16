// npm packages
import sinon from 'sinon';

// our packages
import app from './fixtures/server';
import clean from '../src/clean';

export default (test) => {
  // create clean method that fails on second call
  let calls = 0;
  app.post('/api/clean', (req, res) => {
    if (calls === 0) {
      res.sendStatus(204);
    } else {
      res.sendStatus(403);
    }
    calls += 1;
  });

  // test
  test('Should clean docker', (t) => {
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');
    // execute login
    clean.handler().then(() => {
      // make sure log in was successful
      // first check console output
      t.deepEqual(consoleSpy.args, [
        ['Cleaning docker on:', 'http://localhost:3000'],
        [],
        ['Docker cleaned!'],
      ], 'Correct log output');
      // restore console
      console.log.restore();
      t.end();
    });
  });

  // test
  test('Should catch error during clean', (t) => {
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');
    // execute login
    clean.handler().then(() => {
      // make sure log in was successful
      // first check console output
      t.deepEqual(consoleSpy.args, [
        ['Cleaning docker on:', 'http://localhost:3000'],
        [],
        ['Authentication token expired!', 'Please re-login'],
      ], 'Correct log output');
      // restore console
      console.log.restore();
      t.end();
    });
  });
};

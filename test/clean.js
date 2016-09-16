// npm packages
import sinon from 'sinon';

// our packages
import app from './fixtures/server';
import clean from '../src/clean';

export default (test) => {
  // create clean method
  app.post('/api/clean', (req, res) => {
    res.sendStatus(204);
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
};

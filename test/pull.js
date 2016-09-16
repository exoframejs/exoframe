// npm packages
import sinon from 'sinon';

// our packages
import app from './fixtures/server';
import {sleep} from './fixtures/util';
import pull from '../src/pull';

export default (test) => {
  // test
  test('Should pull the image', (t) => {
    const image = 'test-image';
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');

    // stub server api
    app.get('/api/pull', async (req, res) => {
      // send response
      res.send('');

      await sleep(100);
      // make sure log in was successful
      // first check console output
      t.deepEqual(consoleSpy.args, [
        ['Pulling image on:', 'http://localhost:3000'],
        [],
        ['Done pulling!', 'Your image is now available as test-image'],
      ], 'Correct log output');
      t.equal(req.headers['x-access-token'], 'test-token-123', 'Correct token');
      t.equal(req.query.image, image, 'Correct image ID');

      // restore console
      console.log.restore();
      t.end();
    });

    // execute change
    pull.handler({image});
  });
};

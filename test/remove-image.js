// npm packages
import inquirer from 'inquirer';
import sinon from 'sinon';

// our packages
import app, {images} from './fixtures/server';
import {sleep} from './fixtures/util';
import remove from '../src/remove-image';

export default (test) => {
  // test
  test('Should remove image', (t) => {
    const imageId = images[0].RepoTags[0];
      // stup inquirer answer
    sinon.stub(inquirer, 'prompt', () => Promise.resolve({imageId}));
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');

    // stub server api
    app.post('/api/image/remove/:id', async (req, res) => {
      // send response
      res.sendStatus(204);

      await sleep(100);
      // make sure log in was successful
      // first check console output
      t.deepEqual(consoleSpy.args, [
        ['Removing image on:', 'http://localhost:3000'],
        [],
        ['No image given, fetching list...'],
        ['Owned images:'],
        ['Removing:', 'test-image'],
        ['Image removed!'],
      ], 'Correct log output');
      t.equal(req.headers['x-access-token'], 'test-token-123', 'Correct token');
      t.equal(req.params.id, images[0].Id.slice(0, 12), 'Correct service ID');

      // restore console
      console.log.restore();
      // restore inquirer
      inquirer.prompt.restore();
      t.end();
    });

    // execute change
    remove.handler({});
  });
};

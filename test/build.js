// npm packages
import fs from 'fs';
import os from 'os';
import tar from 'tar-fs';
import path from 'path';
import inquirer from 'inquirer';
import sinon from 'sinon';

// our packages
import app from './fixtures/server';
import {sleep} from './fixtures/util';
import build from '../src/build';

export default (test) => {
  // test
  test('Should build test project', (t) => {
    const userInputTag = 'test-tag';
    const userInputLabels = 'test.label=1';
    const inquirerAnswers = [
      Promise.resolve({userInputTag}), // project tag
      Promise.resolve({userInputLabels}), // new label
      Promise.resolve({userInputLabels: ''}), // empty label to continue
    ];
    let answerIndex = 0;
    // stup inquirer answers
    sinon.stub(inquirer, 'prompt', () => {
      const answer = inquirerAnswers[answerIndex];
      answerIndex += 1;
      return answer;
    });

    // stup project path
    sinon.stub(process, 'cwd', () => path.join(__dirname, 'fixtures', 'test-project'));

    // spy on console
    const consoleSpy = sinon.spy(console, 'log');

    // stub server api
    app.post('/api/build', (req, res) => {
      // extracting a directory
      const resDir = path.join(os.tmpdir(), 'test-project');
      const s = req.pipe(tar.extract(resDir));
      s.on('finish', async () => {
        // send response
        res.sendStatus(204);

        await sleep(100);
        // make sure log in was successful
        // first check console output
        t.deepEqual(consoleSpy.args, [
          ['Building current folder using endpoint:', 'http://localhost:3000'],
          ['Using template:', 'Test Exoframe Template'],
          ['Done building!', 'Your images is now available as test-tag'],
        ], 'Correct log output');
        t.equal(req.query.tag, userInputTag, 'Correct tag sent');
        t.deepEqual(JSON.parse(req.query.labels), {'exoframe.type': 'test', 'test.label': '1'}, 'Correct labels sent');
        t.deepEqual(fs.readdirSync(resDir), ['Dockerfile', 'test.file'], 'Correct files sent');

        // restore console
        console.log.restore();
        // restore inquirer
        inquirer.prompt.restore();
        // restore process
        process.cwd.restore();
        t.end();
      });
    });

    // execute change
    build.handler({});
  });
};

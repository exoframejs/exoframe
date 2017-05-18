// npm packages
const tap = require('tap');
const fs = require('fs');
const path = require('path');
const nock = require('nock');
const sinon = require('sinon');

// our packages
const {handler: deploy} = require('../src/commands/deploy');

module.exports = () => {
  const folder = 'test_html_project';
  const folderPath = path.join('test', 'fixtures', folder);
  const testFolder = path.join(__dirname, 'fixtures', folder);

  // test
  tap.test('Should deploy', t => {
    // spy on console
    const consoleSpy = sinon.spy(console, 'log');

    // handle correct request
    const deployServer = nock('http://localhost:8080').post('/deploy').reply((uri, requestBody, cb) => {
      const excgf = fs.readFileSync(path.join(testFolder, 'exoframe.json'));
      const index = fs.readFileSync(path.join(testFolder, 'index.html'));
      t.ok(requestBody.includes(excgf), 'Should send correct config');
      t.ok(requestBody.includes(index), 'Should send correct index file');

      cb(null, [200, {status: 'success', names: ['test']}]);
    });

    // execute login
    deploy({_: [folderPath]}).then(() => {
      // make sure log in was successful
      // check that server was called
      t.ok(deployServer.isDone());
      // first check console output
      t.deepEqual(
        consoleSpy.args,
        [
          [`Deploying ${folderPath} to endpoint:`, 'http://localhost:8080'],
          ['Done!', 'Your project is now deployed as:\n  > test'],
        ],
        'Correct log output'
      );
      // restore console
      console.log.restore();
      t.end();
    });
  });
};

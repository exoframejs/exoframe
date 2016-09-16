// npm packages
import inquirer from 'inquirer';
import sinon from 'sinon';

// our packages
import app from './fixtures/server';
import {sleep} from './fixtures/util';
import deploy from '../src/deploy';

export default (test) => {
  // test
  test('Should deploy test project', (t) => {
    const inImage = 'test-tag';
    const inquirerAnswers = [
      Promise.resolve({inImage}), // image name
      Promise.resolve({features: [
        'Set restart policy', 'Forward ports', 'Add custom labels',
        'Add environment variables', 'Add volumes', 'Link with other services',
      ]}), // features to pick
      Promise.resolve({inPorts: '80:80'}), // ports
      Promise.resolve({inPorts: ''}), // empty ports to continue
      Promise.resolve({inLinks: 'link-container:link-name'}), // links
      Promise.resolve({inLabels: 'test.label=1'}), // labels
      Promise.resolve({inLabels: ''}), // empty labels to continue
      Promise.resolve({inEnv: 'TEST_ENV=1'}), // env
      Promise.resolve({inEnv: ''}), // empty env to continue
      Promise.resolve({inVolumes: '/tmp:/tmp'}), // volume
      Promise.resolve({inVolumes: ''}), // empty volume to continue
      Promise.resolve({inRestart: 'on-failure', inRestartRetries: 2}), // restart policy
    ];
    let answerIndex = 0;
    // stup inquirer answers
    sinon.stub(inquirer, 'prompt', () => {
      const answer = inquirerAnswers[answerIndex];
      answerIndex += 1;
      return answer;
    });

    // stub images and services list
    app.get('/api/images', (req, res) => res.send([]));
    app.get('/api/services', (req, res) => res.send([{Names: ['test'], Status: 'up'}]));

    // spy on console
    const consoleSpy = sinon.spy(console, 'log');

    // stub server api
    app.post('/api/deploy', async (req, res) => {
      // send response
      res.send([{id: '12345678901234567890'}]);

      await sleep(100);
      // make sure log in was successful
      // first check console output
      t.deepEqual(consoleSpy.args, [
        ['Deploying:', 'test-tag', 'on', 'http://localhost:3000'],
        ['Successfully deployed!'],
        ['1)', 'Container with ID:', '123456789012'],
      ], 'Correct log output');
      t.equal(req.headers['x-access-token'], 'test-token-123', 'Correct token');
      t.deepEqual(req.body.services[0], {
        name: 'test-tag',
        ports: ['80:80'],
        labels: [],
        env: ['TEST_ENV=1'],
        restart: {name: 'on-failure', retries: 2},
        volumes: ['/tmp:/tmp'],
        links: ['test.label=1'],
      }, 'Correct service data');

      // restore console
      console.log.restore();
      // restore inquirer
      inquirer.prompt.restore();
      t.end();
    });

    // execute change
    deploy.handler({});
  });
};

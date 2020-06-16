/* eslint-env jest */
import fs from 'fs';
import path from 'path';
import nock from 'nock';
import _ from 'highland';
import {Stream} from 'stream';
import tar from 'tar-fs';
import {deploy, ResponseData} from '../src/deploy';
import {ServiceSpec} from '../src/utils/formatServices';

// reply with stream helper
const replyWithStream = (dataArr: ResponseData[]): [number, Stream] => {
  const replyStream: Highland.Stream<string> = _();
  dataArr.forEach(data => replyStream.write(JSON.stringify(data)));
  replyStream.end();
  return [200, replyStream.toNodeStream()];
};

const folder = 'test_html_project';
const folderPath = path.join('test', 'fixtures', folder);
const testFolder = path.join(__dirname, 'fixtures', folder);

/* const ignoreFolder = 'test_ignore_project';
const ignoreFolderPath = path.join('test', 'fixtures', ignoreFolder);
const ignoreTestFolder = path.join(__dirname, 'fixtures', ignoreFolder);

const customConfigFolder = 'test_custom_config_project';
const customConfigFolderPath = path.join('test', 'fixtures', customConfigFolder); */

const deployments: ServiceSpec[] = [
  {
    Id: '123',
    Name: '/test',
    Config: {
      Labels: {
        'exoframe.deployment': 'test',
        'traefik.http.routers.test.rule': 'Host(`localhost`)',
      },
    },
    NetworkSettings: {
      Networks: {
        exoframe: {
          Aliases: ['123', 'test'],
        },
      },
    },
  },
];

// test
test('Should deploy', async () => {
  const endpoint = 'http://localhost:8080';
  // handle correct request
  const deployServer = nock(endpoint)
    .post('/deploy')
    .reply((_uri, requestBody) => {
      const excgf = fs.readFileSync(path.join(testFolder, 'exoframe.json')).toString();
      const index = fs.readFileSync(path.join(testFolder, 'index.html')).toString();
      expect(requestBody).toContain(excgf);
      expect(requestBody).toContain(index);

      return replyWithStream([{message: 'Deployment success!', deployments, level: 'info'}]);
    });

  // execute login
  const result = await deploy({folder: folderPath, endpoint, token: 'test-token', verbose: 3});
  // make sure log in was successful
  // check that server was called
  expect(deployServer.isDone()).toBeTruthy();
  // make sure resulting snapshot is correct
  expect(result).toMatchSnapshot();
  // tear down nock
  deployServer.done();
});
/*
// test
test('Should deploy with endpoint flag', done => {
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');

  // handle correct request
  const deployServer = nock('http://localhost:3000')
    .post('/deploy')
    .reply((uri, requestBody) => {
      const excgf = fs.readFileSync(path.join(testFolder, 'exoframe.json'));
      const index = fs.readFileSync(path.join(testFolder, 'index.html'));
      expect(requestBody).toContain(excgf);
      expect(requestBody).toContain(index);

      return replyWithStream([{message: 'Deployment success!', deployments, level: 'info'}]);
    });

  // execute login
  deploy({_: [folderPath], endpoint: 'http://localhost:3000'}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(deployServer.isDone()).toBeTruthy();
    // first check console output
    expect(consoleSpy.args).toMatchSnapshot();
    // restore console
    console.log.restore();
    // tear down nock
    deployServer.done();
    done();
  });
});

// test
test('Should deploy without path', done => {
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');

  // handle correct request
  const deployServer = nock('http://localhost:8080')
    .post('/deploy')
    .reply(() => replyWithStream([{message: 'Deployment success!', deployments, level: 'info'}]));

  // execute login
  deploy().then(() => {
    // make sure log in was successful
    // check that server was called
    expect(deployServer.isDone()).toBeTruthy();
    // first check console output
    expect(consoleSpy.args).toMatchSnapshot();
    // restore console
    console.log.restore();
    // tear down nock
    deployServer.done();
    done();
  });
});

// test
test('Should deploy without auth but with token', done => {
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // copy original config for restoration
  const originalConfig = Object.assign({}, cfg.userConfig);

  // handle correct request
  const deployServer = nock('http://localhost:8080')
    .post('/deploy')
    .reply(() => replyWithStream([{message: 'Deployment success!', deployments, level: 'info'}]));

  // remove auth from config
  cfg.updateConfig({endpoint: 'http://localhost:8080'});

  // execute login
  deploy({token: 'test-token'}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(deployServer.isDone()).toBeTruthy();
    // first check console output
    expect(consoleSpy.args).toMatchSnapshot();
    // restore console
    console.log.restore();
    // tear down nock
    deployServer.done();
    // restore original config
    cfg.updateConfig(originalConfig);
    done();
  });
});

// test
test('Should execute update', done => {
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');

  // handle correct request
  const updateServer = nock('http://localhost:8080')
    .post('/update')
    .reply(() => replyWithStream([{message: 'Deployment success!', deployments, level: 'info'}]));

  // execute login
  deploy({update: true}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(updateServer.isDone()).toBeTruthy();
    // first check console output
    expect(consoleSpy.args).toMatchSnapshot();
    // restore console
    console.log.restore();
    // tear down nock
    updateServer.done();
    done();
  });
});

// test
test('Should open webpage after deploy', done => {
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');

  // handle correct request
  const deployServer = nock('http://localhost:8080')
    .post('/deploy')
    .reply(() => replyWithStream([{message: 'Deployment success!', deployments, level: 'info'}]));

  // execute
  deploy({open: true}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(deployServer.isDone()).toBeTruthy();
    // make sure opn was called once
    expect(openMock).toHaveBeenCalled();
    // first check console output
    expect(consoleSpy.args).toMatchSnapshot();
    // restore console
    console.log.restore();
    // tear down nock
    deployServer.done();
    done();
  });
});

// test
test('Should deploy with custom config', done => {
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');

  // handle correct request
  const deployServer = nock('http://localhost:8080')
    .post('/deploy')
    .reply((uri, requestBody, cb) => {
      // console.log(uri, requestBody);
      // create new data stream and write array into it
      const s = new Readable();
      s.push(requestBody);
      s.push(null);

      // pipe stream to extraction
      const fileNames = [];
      s.pipe(
        tar.extract('./', {
          ignore: (name, header) => {
            fileNames.push(name);
            return true;
          },
          finish: () => {
            // validate that custom config was rename and is not packed
            expect(fileNames).toContain('exoframe.json');
            expect(fileNames).not.toContain('exoframe-custom.json');
            cb(null, replyWithStream([{message: 'Deployment success!', deployments, level: 'info'}]));
          },
        })
      );
    });

  // execute login
  deploy({_: [customConfigFolderPath], config: 'exoframe-custom.json'}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(deployServer.isDone()).toBeTruthy();
    // first check console output
    expect(consoleSpy.args).toMatchSnapshot();
    // restore console
    console.log.restore();
    // tear down nock
    deployServer.done();
    done();
  });
});

// test
test('Should display error log', done => {
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');

  // handle correct request
  const deployServer = nock('http://localhost:8080')
    .post('/deploy')
    .reply(() =>
      replyWithStream([
        {
          message: 'Build failed! See build log for details.',
          error: 'Build failed! See build log for details.',
          log: ['Error log', 'here'],
          level: 'error',
        },
      ])
    );

  // execute
  deploy().then(() => {
    // make sure log in was successful
    // check that server was called
    expect(deployServer.isDone()).toBeTruthy();
    // first check console output
    expect(consoleSpy.args).toMatchSnapshot();
    // restore console
    console.log.restore();
    // tear down nock
    deployServer.done();
    done();
  });
});

// test
test('Should display error on malformed JSON', done => {
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');

  // handle correct request
  const deployServer = nock('http://localhost:8080')
    .post('/deploy')
    .reply((uri, requestBody, cb) => {
      cb(null, [200, 'Bad Gateway']);
    });

  // execute
  deploy().then(() => {
    // make sure log in was successful
    // check that server was called
    expect(deployServer.isDone()).toBeTruthy();
    // first check console output
    expect(consoleSpy.args).toMatchSnapshot();
    // restore console
    console.log.restore();
    // tear down nock
    deployServer.done();
    done();
  });
});

// test
test('Should display verbose output', done => {
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');

  // handle correct request
  const deployServer = nock('http://localhost:8080')
    .post('/deploy')
    .reply(() => [200, 'Bad Gateway']);

  // execute
  deploy({_: [ignoreFolderPath], verbose: true}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(deployServer.isDone()).toBeTruthy();
    // first check console output
    // check beginning of log
    expect(consoleSpy.args.slice(0, consoleSpy.args.length - 1)).toMatchSnapshot();
    // check error correctness
    const err = consoleSpy.args[consoleSpy.args.length - 1][1];
    expect(err.message).toEqual('Error parsing output!');
    expect(err.response).toBeDefined();
    expect(err.response.error).toEqual('Bad Gateway');
    // restore console
    console.log.restore();
    // tear down nock
    deployServer.done();
    done();
  });
});

// test ignore config
test('Should ignore specified files', done => {
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');

  // handle correct request
  const deployServer = nock('http://localhost:8080')
    .post('/deploy')
    .reply((uri, requestBody) => {
      const exoignore = fs.readFileSync(path.join(ignoreTestFolder, '.exoframeignore'));
      const ignoreme = fs.readFileSync(path.join(ignoreTestFolder, 'ignore.me'));
      const index = fs.readFileSync(path.join(ignoreTestFolder, 'index.js'));
      const packageJson = fs.readFileSync(path.join(ignoreTestFolder, 'package.json'));
      const exocfg = fs.readFileSync(path.join(ignoreTestFolder, 'exoframe.json'));
      const yarnLock = fs.readFileSync(path.join(ignoreTestFolder, 'yarn.lock'));
      expect(requestBody).toContain(index);
      expect(requestBody).toContain(packageJson);
      expect(requestBody).toContain(exocfg);
      expect(requestBody).not.toContain(exoignore);
      expect(requestBody).not.toContain(ignoreme);
      expect(requestBody).not.toContain(yarnLock);

      return replyWithStream([{message: 'Deployment success!', deployments, level: 'info'}]);
    });

  // execute login
  deploy({_: [ignoreFolderPath]}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(deployServer.isDone()).toBeTruthy();
    // first check console output
    expect(consoleSpy.args).toMatchSnapshot();
    // restore console
    console.log.restore();
    // tear down nock
    deployServer.done();
    done();
  });
});

// test
test('Should display error on zero deployments', done => {
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');

  // handle correct request
  const deployServer = nock('http://localhost:8080')
    .post('/deploy')
    .reply((uri, requestBody, cb) => {
      cb(null, [200, {}]);
    });

  // execute
  deploy().then(() => {
    // make sure log in was successful
    // check that server was called
    expect(deployServer.isDone()).toBeTruthy();
    // first check console output
    expect(consoleSpy.args).toMatchSnapshot();
    // restore console
    console.log.restore();
    // tear down nock
    deployServer.done();
    done();
  });
});

// test
test('Should not deploy with config without project name', done => {
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');

  // corrupt config with string
  const exoConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'exoframe.json')));
  exoConfig.name = '';
  fs.writeFileSync(path.join(__dirname, '..', 'exoframe.json'), JSON.stringify(exoConfig));

  // execute deploy
  deploy().then(() => {
    // check console output
    expect(consoleSpy.args).toMatchSnapshot();
    // restore console
    console.log.restore();
    done();
  });
});

// test
test('Should not deploy with broken config', done => {
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');

  // corrupt config with string
  fs.writeFileSync(path.join(__dirname, '..', 'exoframe.json'), 'I am broken json now');

  // execute deploy
  deploy().then(() => {
    // check console output
    expect(consoleSpy.args).toMatchSnapshot();
    // restore console
    console.log.restore();
    done();
  });
});

// test
test('Should not deploy with non-existent path', done => {
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');

  // execute deploy
  deploy({_: ['i-do-not-exist']}).then(() => {
    // check console output
    const pathLine = consoleSpy.args.splice(1, 1).pop();
    expect(consoleSpy.args).toMatchSnapshot();
    expect(pathLine[0].includes('Error! Path')).toBeTruthy();
    expect(pathLine[0].includes(path.join(__dirname, '..', 'i-do-not-exist'))).toBeTruthy();
    expect(pathLine[0].includes('do not exists')).toBeTruthy();
    // restore console
    console.log.restore();
    done();
  });
});

// test
test('Should deauth on 401', done => {
  // handle correct request
  const deployServer = nock('http://localhost:8080').post('/deploy').reply(401, {error: 'Deauth test'});
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // execute login
  deploy({_: [folderPath]}).then(() => {
    // make sure log in was successful
    // check that server was called
    expect(deployServer.isDone()).toBeTruthy();
    // first check console output
    expect(consoleSpy.args).toMatchSnapshot();
    // check config
    expect(cfg.userConfig.user).toBeUndefined();
    expect(cfg.userConfig.token).toBeUndefined();
    // restore console
    console.log.restore();
    // tear down nock
    deployServer.done();
    done();
  });
});
*/

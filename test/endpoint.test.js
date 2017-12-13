/* eslint-env jest */
// npm packages
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const sinon = require('sinon');
const inquirer = require('inquirer');

// our packages
const {handler: updateEndpoint} = require('../src/commands/endpoint');
const {handler: removeEndpoint} = require('../src/commands/endpoint-rm');
const {cleanLogs} = require('./util');

const configPath = path.join(__dirname, 'fixtures', 'cli.config.yml');
const mockEndpoint = 'http://test.endpoint';
const mockEndpoint2 = 'http://test';

// load original config
let origCfg;
beforeAll(() => {
  origCfg = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
});

afterAll(() => {
  // restore original config
  fs.writeFileSync(configPath, yaml.safeDump(origCfg), 'utf8');
});

// test config generation
test('Should add new endpoint', done => {
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // execute login
  updateEndpoint({url: mockEndpoint}).then(() => {
    // first check console output
    const cleanedLogs = cleanLogs(consoleSpy.args);
    expect(cleanedLogs).toEqual([['Updating endpoint URL to:', 'http://test.endpoint'], ['Endpoint URL updated!']]);
    // then check config changes
    const cfg = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
    expect(cfg.endpoint).toEqual(mockEndpoint);
    expect(cfg.user).toEqual(null);
    expect(cfg.token).toEqual(null);
    expect(cfg.endpoints.length).toEqual(1);
    expect(cfg.endpoints[0].endpoint).toEqual(origCfg.endpoint);
    expect(cfg.endpoints[0].user.username).toEqual(origCfg.user.username);
    expect(cfg.endpoints[0].token).toEqual(origCfg.token);
    // restore console
    console.log.restore();
    done();
  });
});

// test config generation
test('Should add second new endpoint', done => {
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // execute login
  updateEndpoint({url: mockEndpoint2}).then(() => {
    // first check console output
    const cleanedLogs = cleanLogs(consoleSpy.args);
    expect(cleanedLogs).toEqual([['Updating endpoint URL to:', mockEndpoint2], ['Endpoint URL updated!']]);
    // then check config changes
    const cfg = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
    expect(cfg.endpoint).toEqual(mockEndpoint2);
    expect(cfg.user).toBeNull();
    expect(cfg.token).toBeNull();
    expect(cfg.endpoints.length).toEqual(2);
    expect(cfg.endpoints[0].endpoint).toEqual(origCfg.endpoint);
    expect(cfg.endpoints[0].user.username).toEqual(origCfg.user.username);
    expect(cfg.endpoints[0].token).toEqual(origCfg.token);
    expect(cfg.endpoints[1].endpoint).toEqual(mockEndpoint);
    expect(cfg.endpoints[1].user).toBeNull();
    expect(cfg.endpoints[1].token).toBeNull();
    // restore console
    console.log.restore();
    done();
  });
});

// test config generation
test('Should select old endpoint', done => {
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // stup inquirer answers
  sinon.stub(inquirer, 'prompt').callsFake(() => Promise.resolve({newEndpoint: origCfg.endpoint}));
  // execute login
  updateEndpoint({}).then(() => {
    // first check console output
    const cleanedLogs = cleanLogs(consoleSpy.args);
    expect(cleanedLogs).toEqual([['Updating endpoint URL to:', 'http://localhost:8080'], ['Endpoint URL updated!']]);
    // then check config changes
    const cfg = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
    expect(cfg.endpoint).toEqual(origCfg.endpoint);
    expect(cfg.user.username).toEqual(origCfg.user.username);
    expect(cfg.token).toEqual(origCfg.token);
    expect(cfg.endpoints.length).toEqual(2);
    expect(cfg.endpoints[0].endpoint).toEqual(mockEndpoint);
    expect(cfg.endpoints[0].user).toBeNull();
    expect(cfg.endpoints[0].token).toBeNull();
    expect(cfg.endpoints[1].endpoint).toEqual(mockEndpoint2);
    expect(cfg.endpoints[1].user).toBeNull();
    expect(cfg.endpoints[1].token).toBeNull();
    // restore console
    console.log.restore();
    // restore inquirer
    inquirer.prompt.restore();
    done();
  });
});

// test config generation
test('Should select old endpoint using URL param', done => {
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // execute login
  updateEndpoint({url: mockEndpoint}).then(() => {
    // first check console output
    const cleanedLogs = cleanLogs(consoleSpy.args);
    expect(cleanedLogs).toEqual([['Updating endpoint URL to:', mockEndpoint], ['Endpoint URL updated!']]);
    // then check config changes
    const cfg = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
    expect(cfg.endpoint).toEqual(mockEndpoint);
    expect(cfg.user).toBeNull();
    expect(cfg.token).toBeNull();
    expect(cfg.endpoints.length).toEqual(2);
    expect(cfg.endpoints[0].endpoint).toEqual(mockEndpoint2);
    expect(cfg.endpoints[0].user).toBeNull();
    expect(cfg.endpoints[0].token).toBeNull();
    expect(cfg.endpoints[1].endpoint).toEqual(origCfg.endpoint);
    expect(cfg.endpoints[1].user.username).toEqual(origCfg.user.username);
    expect(cfg.endpoints[1].token).toEqual(origCfg.token);
    // restore console
    console.log.restore();
    done();
  });
});

test('Should show error on remove of non-existent endpoint', done => {
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // stup inquirer answers
  sinon.stub(inquirer, 'prompt').callsFake(() => Promise.resolve({delEndpoint: 'do-not-exist'}));
  // execute login
  removeEndpoint({}).then(() => {
    // first check console output
    const cleanedLogs = cleanLogs(consoleSpy.args);
    expect(cleanedLogs).toEqual([['Error!', "Couldn't find endpoint with URL:", 'do-not-exist']]);
    // restore console
    console.log.restore();
    // restore inquirer
    inquirer.prompt.restore();
    done();
  });
});

test('Should remove current endpoint using inquirer', done => {
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // stup inquirer answers
  sinon.stub(inquirer, 'prompt').callsFake(() => Promise.resolve({delEndpoint: mockEndpoint}));
  // execute login
  removeEndpoint({}).then(() => {
    // first check console output
    const cleanedLogs = cleanLogs(consoleSpy.args);
    expect(cleanedLogs).toEqual([['Removing endpoint:', mockEndpoint], ['Endpoint removed!']]);
    // then check config changes
    const cfg = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
    expect(cfg.endpoint).toEqual(mockEndpoint2);
    expect(cfg.user).toBeNull();
    expect(cfg.token).toBeNull();
    expect(cfg.endpoints.length).toEqual(1);
    expect(cfg.endpoints[0].endpoint).toEqual(origCfg.endpoint);
    expect(cfg.endpoints[0].user.username).toEqual(origCfg.user.username);
    expect(cfg.endpoints[0].token).toEqual(origCfg.token);
    // restore console
    console.log.restore();
    // restore inquirer
    inquirer.prompt.restore();
    done();
  });
});

test('Should remove existing endpoint using param', done => {
  let consoleSpy;
  // select original endpoint to test removal from list
  updateEndpoint({url: origCfg.endpoint})
    .then(() => {
      // spy on console
      consoleSpy = sinon.spy(console, 'log');
      // execute login
      return removeEndpoint({url: mockEndpoint2});
    })
    .then(() => {
      // first check console output
      const cleanedLogs = cleanLogs(consoleSpy.args);
      expect(cleanedLogs).toEqual([['Removing endpoint:', mockEndpoint2], ['Endpoint removed!']]);
      // then check config changes
      const cfg = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
      console.log(cfg);
      expect(cfg.endpoint).toEqual(origCfg.endpoint);
      expect(cfg.user.username).toEqual(origCfg.user.username);
      expect(cfg.token).toEqual(origCfg.token);
      expect(cfg.endpoints.length).toEqual(0);
      // restore console
      console.log.restore();
      done();
    });
});

test('Should not remove only endpoint', done => {
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // stup inquirer answers
  sinon.stub(inquirer, 'prompt').callsFake(() => Promise.resolve({delEndpoint: origCfg.endpoint}));
  // execute login
  removeEndpoint({}).then(() => {
    // first check console output
    const cleanedLogs = cleanLogs(consoleSpy.args);
    expect(cleanedLogs).toEqual([['Error!', 'Cannot remove the only endpoint URL:', origCfg.endpoint]]);
    // then check config changes
    const cfg = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
    expect(cfg.endpoint).toEqual(origCfg.endpoint);
    expect(cfg.user.username).toEqual(origCfg.user.username);
    expect(cfg.token).toEqual(origCfg.token);
    expect(cfg.endpoints.length).toEqual(0);
    // restore console
    console.log.restore();
    // restore inquirer
    inquirer.prompt.restore();
    done();
  });
});

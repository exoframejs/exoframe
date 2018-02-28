/* eslint-env jest */
// mock config for testing
jest.mock('../src/config', () => require('./__mocks__/config'));

// npm packages
const sinon = require('sinon');
const inquirer = require('inquirer');

// our packages
const {handler: updateEndpoint} = require('../src/commands/endpoint');
const {handler: removeEndpoint} = require('../src/commands/endpoint-rm');
const cfg = require('../src/config');

const mockEndpoint = 'http://test.endpoint';
const mockEndpoint2 = 'http://test';

let origCfg;
beforeAll(() => {
  origCfg = Object.assign({}, cfg.userConfig);
});

// test config generation
test('Should add new endpoint', done => {
  // spy on console
  const consoleSpy = sinon.spy(console, 'log');
  // execute login
  updateEndpoint({url: mockEndpoint}).then(() => {
    // first check console output
    expect(consoleSpy.args).toMatchSnapshot();
    // then check config changes
    expect(cfg.userConfig.endpoint).toEqual(mockEndpoint);
    expect(cfg.userConfig.user).toEqual(null);
    expect(cfg.userConfig.token).toEqual(null);
    expect(cfg.userConfig.endpoints.length).toEqual(1);
    expect(cfg.userConfig.endpoints[0].endpoint).toEqual(origCfg.endpoint);
    expect(cfg.userConfig.endpoints[0].user.username).toEqual(origCfg.user.username);
    expect(cfg.userConfig.endpoints[0].token).toEqual(origCfg.token);
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
    expect(consoleSpy.args).toMatchSnapshot();
    // then check config changes
    expect(cfg.userConfig.endpoint).toEqual(mockEndpoint2);
    expect(cfg.userConfig.user).toBeNull();
    expect(cfg.userConfig.token).toBeNull();
    expect(cfg.userConfig.endpoints.length).toEqual(2);
    expect(cfg.userConfig.endpoints[0].endpoint).toEqual(origCfg.endpoint);
    expect(cfg.userConfig.endpoints[0].user.username).toEqual(origCfg.user.username);
    expect(cfg.userConfig.endpoints[0].token).toEqual(origCfg.token);
    expect(cfg.userConfig.endpoints[1].endpoint).toEqual(mockEndpoint);
    expect(cfg.userConfig.endpoints[1].user).toBeNull();
    expect(cfg.userConfig.endpoints[1].token).toBeNull();
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
    expect(consoleSpy.args).toMatchSnapshot();
    // then check config changes
    expect(cfg.userConfig.endpoint).toEqual(origCfg.endpoint);
    expect(cfg.userConfig.user.username).toEqual(origCfg.user.username);
    expect(cfg.userConfig.token).toEqual(origCfg.token);
    expect(cfg.userConfig.endpoints.length).toEqual(2);
    expect(cfg.userConfig.endpoints[0].endpoint).toEqual(mockEndpoint);
    expect(cfg.userConfig.endpoints[0].user).toBeNull();
    expect(cfg.userConfig.endpoints[0].token).toBeNull();
    expect(cfg.userConfig.endpoints[1].endpoint).toEqual(mockEndpoint2);
    expect(cfg.userConfig.endpoints[1].user).toBeNull();
    expect(cfg.userConfig.endpoints[1].token).toBeNull();
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
    expect(consoleSpy.args).toMatchSnapshot();
    // then check config changes
    expect(cfg.userConfig.endpoint).toEqual(mockEndpoint);
    expect(cfg.userConfig.user).toBeNull();
    expect(cfg.userConfig.token).toBeNull();
    expect(cfg.userConfig.endpoints.length).toEqual(2);
    expect(cfg.userConfig.endpoints[0].endpoint).toEqual(mockEndpoint2);
    expect(cfg.userConfig.endpoints[0].user).toBeNull();
    expect(cfg.userConfig.endpoints[0].token).toBeNull();
    expect(cfg.userConfig.endpoints[1].endpoint).toEqual(origCfg.endpoint);
    expect(cfg.userConfig.endpoints[1].user.username).toEqual(origCfg.user.username);
    expect(cfg.userConfig.endpoints[1].token).toEqual(origCfg.token);
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
    expect(consoleSpy.args).toMatchSnapshot();
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
    expect(consoleSpy.args).toMatchSnapshot();
    // then check config changes
    expect(cfg.userConfig.endpoint).toEqual(mockEndpoint2);
    expect(cfg.userConfig.user).toBeNull();
    expect(cfg.userConfig.token).toBeNull();
    expect(cfg.userConfig.endpoints.length).toEqual(1);
    expect(cfg.userConfig.endpoints[0].endpoint).toEqual(origCfg.endpoint);
    expect(cfg.userConfig.endpoints[0].user.username).toEqual(origCfg.user.username);
    expect(cfg.userConfig.endpoints[0].token).toEqual(origCfg.token);
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
      expect(consoleSpy.args).toMatchSnapshot();
      // then check config changes
      expect(cfg.userConfig.endpoint).toEqual(origCfg.endpoint);
      expect(cfg.userConfig.user.username).toEqual(origCfg.user.username);
      expect(cfg.userConfig.token).toEqual(origCfg.token);
      expect(cfg.userConfig.endpoints.length).toEqual(0);
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
    expect(consoleSpy.args).toMatchSnapshot();
    // then check config changes
    expect(cfg.userConfig.endpoint).toEqual(origCfg.endpoint);
    expect(cfg.userConfig.user.username).toEqual(origCfg.user.username);
    expect(cfg.userConfig.token).toEqual(origCfg.token);
    expect(cfg.userConfig.endpoints.length).toEqual(0);
    // restore console
    console.log.restore();
    // restore inquirer
    inquirer.prompt.restore();
    done();
  });
});

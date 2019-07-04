# Function deployments

Exoframe also allows deploying simple Node.js functions using Exoframe Server itself.

## Setup

To deploy a function, `exoframe.json` needs to indicate that current project is a function.
You can easily do that by running the following command:

```
exoframe init -f
```

If you want more fine-grained config - simply run `exoframe config` and answer interactive questions.

By default, Exoframe Server expects `index.js` file only.  
You might add `package.json` with dependencies - in this case `yarn install` will be executed before loading the function.

## Types

Each deployed function has a `type` property in the config.  
Exoframe currently supports 4 different function types:

### HTTP functions

Basic HTTP handler function.  
This is used as a default type for any deployed function without explicitly specified type.

### Worker functions

Long-running function that is executed in a separate [worker thread](https://nodejs.org/api/worker_threads.html).

### Trigger functions

Custom user-defined trigger that can dispatch event for other custom functions to react to.  
Can be useful to granularly execute functions that react to e.g. database changes.

### Custom functions

React to custom user-defined triggers.  
Should have type that matches the name of the trigger.

## Logging

If your function uses provided by Exoframe logger - you can fetch function logs by using `exoframe logs` command in CLI.

## Caveats

- All defined functions have to be `async` or return promise.
- Deployed functions have a separate `function.route` setting and do not take `domain` config into account - they'll always be served from your Exoframe Server.
- By default Exoframe Server imports function by using a folder name. This means function entry point file _must be_ `index.js`. This can be changed by adding `package.json` and changing `"main": "file.js"` property.

## Examples

### Simple HTTP function

```js
// exoframe.json
{
  "name": "test-http-fn",
  "function": {
    // no type is given, so it defaults to http
    // will be served from http://exoframe.domain.com/test
    "route": "/test"
  }
}

// index.js
module.exports = async (event, context) => {
  // use context.log to provide logs to exoframe
  // those logs can be then accessed from exoframe CLI
  context.log('test log');
  context.log('other log');

  // you can just return a value
  return `hello world`;

  // alternatively you can use reply prop
  // to directly access Fastify reply object
  context.reply.code(200).send('hello world!');
  // make sure to return false-y value if you do this
  // so exoframe doesn't try to send the response second time
  return false;
};
```

### Simple Worker function

```js
// exoframe.json
{
  "name": "test-worker-fn",
  "function": {
    // define type as worker, so that exoframe starts
    // the function using worker thread
    "type": "worker"
  }
}

// index.js
module.exports = async (_, context) => {
  // use context.log to log stuff, just as in HTTP function
  context.log('Worker started.');
  // worker can execute any long-running task you want
  let counter = 0;
  setInterval(() => {
    context.log(`Worker: ${counter++}`);
  }, 1000);
};
```

### Simple Trigger function

```js
// exoframe.json
{
  "name": "test-trigger",
  "function": {
    // define type as trigger, so that exoframe provides it a way
    // to dispatch events for other functions
    "type": "trigger"
  }
}

// index.js
module.exports = async (dispatchEvent, context) => {
  // log
  context.log('Trigger started.');

  // in this case we trigger all subscribed functions every 1s
  const interval = setInterval(() => {
    context.log(`Triggering!`);
    // dispatching new events to all function with data
    dispatchEvent({data: 'hello world!'});
  }, 1000);

  // trigger function should return a cleanup function
  return () => {
    clearInterval(interval);
  };
};
```

### Simple Custom trigger handler function

```js
// exoframe.json
{
  "name": "test-triggered-fn",
  "function": {
    // define type as "test-trigger", so that exoframe knows that
    // custom dispatched events from test-trigger must be handled by this function
    "type": "test-trigger"
  }
}

// index.js
module.exports = async (event, context) => {
  // Will get custom data from trigger above, so logging will say:
  // Custom function triggered: {"data": "hello world!"}
  context.log(`Custom function triggered: ${JSON.stringify(event.data)}`);
};
```

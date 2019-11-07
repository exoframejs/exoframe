// custom completion target
// fixes completion not working with catch-all command
// see https://github.com/yargs/yargs/issues/1261
module.exports = yargs => ({
  command: ['completion'],
  describe: 'generate completion script',
  builder: {},
  handler: () => yargs.showCompletionScript(),
});

#!/usr/bin/env node
import { html } from 'htm/react';
import { render } from 'ink';
import { Counter } from './src/counter.js';

const main = async () => {
  const app = render(html`<${Counter} />`);

  await app.waitUntilExit();
};

main();

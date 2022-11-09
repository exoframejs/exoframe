#!/usr/bin/env node
import createNewProgram from './src/index.js';

const program = await createNewProgram();
program.parse(process.argv);

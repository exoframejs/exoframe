#!/usr/bin/env node
import { createProgram } from './src/index.js';

const program = await createProgram();
program.parse(process.argv);

#!/usr/bin/env node
import { createProgram } from './src/index.ts';

const program = await createProgram();
program.parse(process.argv);

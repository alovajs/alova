#!/usr/bin/env node
import build from './src/build/index.js';
import changeset from './src/bump/index.js';

const run = async function run() {
  const [cmd, ...args] = process.argv.slice(2);
  switch (cmd) {
    /**
     * bundle package according to `build.json` in target folder
     */
    case 'build': {
      await build(...args);
      break;
    }
    case 'bump': {
      await changeset(...args);
      break;
    }
    default:
      break;
  }
};

run();

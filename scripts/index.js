#!/usr/bin/env node
const run = async function run() {
  const [cmd, ...args] = process.argv.slice(2);
  // eslint-disable-next-line
  switch (cmd) {
    /**
     * bundle package according to `build.json` in target folder
     */
    case 'build': {
      // eslint-disable-next-line
      const build = require('./src/build/index.js');
      await build(...args);
      break;
    }
    case 'bump': {
      // eslint-disable-next-line
      const changeset = require('./src/bump/index.js');
      await changeset(...args);
      break;
    }
  }
};

run();

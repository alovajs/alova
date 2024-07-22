#!/usr/bin/env node
const run = (module.exports = async function run() {
  const [cmd, ...args] = process.argv.slice(2);
  // eslint-disable-next-line
  switch (cmd) {
    case 'build': {
      // eslint-disable-next-line
      const build = require('./src/build/index.js');
      await build(...args);
      break;
    }
  }
});

run();

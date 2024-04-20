#!/usr/bin/env node
const run = (module.exports = async function run() {
  const [cmd, ...args] = process.argv.slice(2);
  switch (cmd) {
    case 'build': {
      const build = require('./src/build/index.js');
      await build(...args);
      break;
    }
  }
});

run();

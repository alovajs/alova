const { resolve } = require('node:path');

/** @type{import('@rollup/plugin-alias').Alias[]} */
const alias = [
  {
    find: '@/',
    replacement: resolve('./src/')
  },
  {
    find: '~/',
    replacement: resolve('./')
  }
];

exports.entries = alias;

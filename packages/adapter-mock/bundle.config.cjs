module.exports = {
  input: 'src/index.ts',
  output: 'dist/alova-mock.{suffix}.js',
  packageName: 'AlovaMock',
  external: {
    alova: 'alova'
  }
};

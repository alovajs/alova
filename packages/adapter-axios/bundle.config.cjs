module.exports = {
  input: 'src/index.ts',
  output: 'dist/alova-adapter-axios.{suffix}.js',
  packageName: 'AlovaAdapterAxios',
  external: {
    alova: 'alova',
    axios: 'axios'
  }
};

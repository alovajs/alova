module.exports = {
  env: { browser: true, es2020: true },
  extends: ['plugin:vue/essential', 'standard'],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['vue'],
  rules: {
    // 在这里添加或覆盖规则
  }
};

module.exports = {
  root: true,
  extends: ['expo'],
  ignorePatterns: ['dist/*'],
  overrides: [
    {
      files: ['*.config.js', '*.config.cjs'],
      env: { node: true },
    },
  ],
};

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@app': './src/app',
          '@config': './src/config',
          '@features': './src/features',
          '@navigation': './src/navigation',
          '@theme': './src/theme',
          '@utils': './src/utils',
        },
      },
    ],
  ],
};

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // The worklets plugin has to be listed last.
    plugins: ["react-native-worklets/plugin"],
  };
};

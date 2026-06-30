module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // react-native-worklets/plugin powers Reanimated 4 — must be listed LAST
    plugins: ["react-native-worklets/plugin"],
  };
};

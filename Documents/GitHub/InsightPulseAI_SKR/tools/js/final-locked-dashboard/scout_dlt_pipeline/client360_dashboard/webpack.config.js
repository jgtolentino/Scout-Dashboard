const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  const mode = argv.mode || 'development';
  const themeName = env.theme || 'tbwa';

  return {
    mode,
    entry: {
      [themeName]: `./src/themes/${themeName}.scss`
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js', // Not used, but required
    },
    module: {
      rules: [
        {
          test: /\.scss$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader',
            'sass-loader',
          ],
        },
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: '[name].css',
      }),
    ],
  };
};
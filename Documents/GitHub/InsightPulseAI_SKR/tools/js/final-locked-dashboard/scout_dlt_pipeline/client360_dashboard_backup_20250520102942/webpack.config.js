// webpack.config.js
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env = {}) => {
  // If a specific theme is requested, build only that theme
  const entries = env.theme 
    ? { [env.theme]: `./src/themes/${env.theme}.scss` }
    : {
        tbwa: './src/themes/tbwa.scss',
        sarisari: './src/themes/sarisari.scss',
        // Add more brands here as needed
      };
  
  return {
    entry: entries,
    output: { 
      path: path.resolve(__dirname, './dist'), 
      filename: '[name].js' // JS stubs only
    },
    module: {
      rules: [
        {
          test: /\.scss$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader', // autoprefixer, etc.
            'sass-loader'
          ]
        },
        {
          test: /\.(svg|png|jpg)$/,
          type: 'asset/resource',
          generator: { filename: 'assets/[name][ext]' }
        }
      ]
    },
    plugins: [
      new MiniCssExtractPlugin({ filename: '[name].css' })
    ]
  };
};
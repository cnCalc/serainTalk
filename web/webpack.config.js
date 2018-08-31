var path = require('path');
var webpack = require('webpack');
var express = require('express');
var UglifyJsPlugin = require('uglifyjs-webpack-plugin');
var { VueLoaderPlugin } = require('vue-loader');

module.exports = {
  entry: './src/main.js',
  output: {
    path: path.resolve(__dirname, './dist'),
    publicPath: '/dist/',
    filename: 'build.js',
  },
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          loaders: {
            // Since sass-loader (weirdly) has SCSS as its default parse mode, we map
            // the "scss" and "sass" values for the lang attribute to the right configs here.
            // other preprocessors should work out of the box, no loader config like this necessary.
            'scss': 'vue-style-loader!css-loader!sass-loader',
            'sass': 'vue-style-loader!css-loader!sass-loader?indentedSyntax',
          },
          // other vue-loader options go here
        },
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]?[hash]',
        },
      },
      {
        test: /\.scss$/,
        use: [
          'vue-style-loader',
          'css-loader',
          'sass-loader',
        ],
      },
      {
        test: /\.pug$/,
        loader: 'pug-plain-loader',
      },
    ],
  },
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.esm.js',
    },
  },
  devServer: {
    historyApiFallback: true,
    noInfo: true,
    proxy: {
      '/api/': {
        target: 'http://localhost:8000/',
        ws: true,
      },
    },
    before (app) {
      app.use('/avatar', express.static('../uploads/avatar'));
    },
  },
  performance: {
    hints: false,
  },
  devtool: '#source-map',
  plugins: [
    new VueLoaderPlugin(),
  ]
};

if (process.env.NODE_ENV === 'production') {
  module.exports.devtool = '#source-map';
  module.exports.mode = 'production';
  module.exports.optimization = {
    runtimeChunk: {
      name: 'manifest'
    },
    // minimizer: [
    //   new UglifyJsPlugin({
    //     cache: true,
    //     parallel: true,
    //     sourceMap: true,
    //   }),
    // ],
  };
  // http://vue-loader.vuejs.org/en/workflow/production.html
  module.exports.plugins = (module.exports.plugins || []).concat([
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"',
      },
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true,
    }),
  ]);
}

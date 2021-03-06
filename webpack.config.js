const env = process.env.NODE_TYPE == 'production' // 判断开发环境
const webpack = require('webpack')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer')
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const NotifierWebpackPlugin = require('friendly-errors-webpack-plugin')
const notify = require('node-notifier')

let plugins = [] // plugins
let externals = {} // externals

if (env) {
  plugins.push(
    // 清除上次构建记录
    new CleanWebpackPlugin({
      dry: false,
      cleanOnceBeforeBuildPatterns: [path.resolve(__dirname, 'build')]
    }),
    new HtmlWebpackPlugin({
      title: 'chat',
      inject: true,
      filename: 'index.html',
      template: path.resolve(__dirname, 'index.html'),
      favicon: path.resolve(__dirname, 'src/assets/favicon.ico'),
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true
      },
      cdn: {
        js: [
          'https://cdn.bootcdn.net/ajax/libs/react/16.13.1/umd/react.production.min.js',
          'https://cdn.bootcdn.net/ajax/libs/react-dom/16.13.1/umd/react-dom.production.min.js',
          // 'https://cdn.bootcdn.net/ajax/libs/react-redux/7.2.0/react-redux.min.js',
          // 'https://cdn.bootcdn.net/ajax/libs/redux/4.0.5/redux.min.js',
        ]
      }
    }),
    // 合并css
    new MiniCssExtractPlugin({
      filename: 'css/[name].css'
    }),
    // 压缩css
    new OptimizeCSSPlugin(),
    // 压缩js
    new UglifyJsPlugin({
      sourceMap: false, // 使用sourceMap捕获错误
      parallel: true, // 多线程构建
      cache: true, // 开启缓存
      // uglifyOptions: {
      //   compress: {
      //     drop_console: true, // 放弃对 console 函数的调用
      //     drop_debugger: true, // 删除 debugger语句
      //   }
      // },
    }),
    // 打包分析
    new BundleAnalyzerPlugin({
      analyzerMode: 'server',
      analyzerHost: '127.0.0.1',
      analyzerPort: '5555',
      reportFilename: 'report.html',
      defaultSizes: 'parsed',
      openAnalyzer: true,
      generateStatsFile: false,
      statsFilename: 'stats.json',
      statsOptions: null,
      logLevel: 'info'
    }),
  )
  externals = {
    react: 'React',
    'react-dom': 'ReactDOM',
  }
} else {
  plugins.push(
    new HtmlWebpackPlugin({
      title: 'chat',
      inject: true,
      filename: 'index.html',
      template: path.resolve(__dirname, 'index.html'),
      favicon: path.resolve(__dirname, 'src/assets/favicon.ico'),
    }),
    new NotifierWebpackPlugin({
      // 编译成功处理
      compilationSuccessInfo: {
        messages: ['Compiler result at http://localhost:8080']
      },
      // 编译失败处理
      onErrors: (result, errors) => {
        if (result == 'error') {
          console.log(errors)
          notify.notify({
            title: 'Webpack error',
            message: `${result}：${errors[0].name}`,
            subtitle: errors[0].file || '',
            icon: path.resolve(__dirname, 'src/assets/img/chat_head_img.jpg')
          })
        }
      },
      // 是否每次编译完成清除控制台
      clearConsole: true,
    }),
    new webpack.HotModuleReplacementPlugin(), // 热加载
  )
}

module.exports = {
  entry: path.resolve(__dirname, 'src/index.js'),
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'js/build.js'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        use: {
          loader: 'babel-loader',
          options: {
            include: path.join(__dirname, 'src'),
            exclude: '/node_modules/', // 排除node_modules，第三方代码已经处理，不需要二次处理
          }
        }
      },
      // 处理css
      {
        test: /\.(css)$/,
        use: [
          env ? MiniCssExtractPlugin.loader : 'style-loader',
          'css-loader',
          'postcss-loader'
        ]
      },
      // 处理图片
      {
        test: /\.(jpe?g|png|gif|svg)$/,
        use: {
          loader: 'url-loader',
          options: {
            esModule: false, // 设为false，否则图片编译为 [object Module]
            name: '[name].[hash:8].[ext]', // 以原图片名输出
            outputPath: 'images', // 输出路径
            limit: 10240, // 超过10K打包为图片，反之打包为base64
            // publicPath:'../',
          }
        }
      },
      // 处理音视频
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)$/,
        use: {
          loader: 'url-loader',
          options: {
            name: '[name].[hash:8].[ext]', // 以原文件名输出
            outputPath: 'media',
            limit: 10240
          }
        }
      },
      // 处理字体文件
      {
        test: /\.(woff2|eot|ttf|otf)$/,
        use: {
          loader: 'url-loader',
          options: {
            name: '[name].[hash:8].[ext]', // 以原文件名输出
            outputPath: 'font',
            limit: 10240
          }
        }
      }
    ]
  },
  plugins: [
    ...plugins,
  ],
  optimization: {
    splitChunks: {
      chunks: 'initial', // 对入口文件处理
      cacheGroups: {
        vendor: {
          test: /node_modules\//,
          name: 'js/vendor.js',
          priority: 10,
          enforce: true
        },
        common: {
          minChunks: 2,
          name: 'js/common.js',
          priority: 10,
          enforce: true
        }
      },
    },
    runtimeChunk: {
      name: 'manifest'
    },
    minimizer: []
  },
  devServer: {
    host: '0.0.0.0', // host地址
    port: '8080', // 端口
    open: true, //自动拉起浏览器
    hot: true, //热加载
    hotOnly: false, // 热加载不更新
    // proxy: {}, // 跨域
    // bypass: {} // 拦截器
    quiet: true, // 隐藏控制台编译过程
    clientLogLevel: 'warning', // 隐藏客户端编译过程/结果
    overlay: {warnings: true, errors: true}, // 客户端显示报错信息
  },
  externals: externals
}

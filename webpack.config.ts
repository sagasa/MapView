import path from 'path';
import { Configuration as WebpackConfiguration } from "webpack";
import { Configuration as WebpackDevServerConfiguration } from "webpack-dev-server";

import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import CompressionPlugin from 'compression-webpack-plugin';
import zopfli from 'node-zopfli';

interface Configuration extends WebpackConfiguration {
    devServer?: WebpackDevServerConfiguration;
  }

const config: Configuration = {
    plugins: [
        //new BundleAnalyzerPlugin(),
        /*
        new CompressionPlugin({
            test: /\.js$/,
            algorithm: (source, compressionOptions:any, callback) => {
              return zopfli.gzip(Buffer.from(source), compressionOptions, callback);
            }
          })//*/
      ],
    context: path.join(__dirname, 'src'),
    entry: './index.tsx',
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'bundle.js',
        publicPath: '/assets',
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
            },
        ],
    },
    mode: "development",
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
    devtool: "inline-source-map",
    devServer: {
        open: true,
        port: 3000,
        allowedHosts:["all"],
        compress: true,
        static:{
            directory:path.resolve(__dirname, 'static'),
        }
    },
};

export default config;
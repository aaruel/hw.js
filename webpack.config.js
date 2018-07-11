const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require("path");

module.exports = {
    entry: "./src/main",
    mode: 'development',
    resolve: {
        extensions: [".js", ".ts"]
    },
    devtool: "inline-source-map",
    devServer: {
        open: false,
        contentBase: path.join(__dirname, 'dist'),
        compress: true,
        port: 1234
    },
    output: {
        path: path.resolve("./dist"),
        filename: "[name].js"
    },
    module: {
        rules: [{
            test: /.ts$/,
            use: 'ts-loader',
        }],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './index.html'
        }),
    ]
};
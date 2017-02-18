var webpack = require('webpack')
var path = require('path')

var BUILD_DIR = path.resolve(__dirname, 'assets/build')
var APP_DIR = path.resolve(__dirname, 'assets/components')
var ACTIONS_DIR = path.resolve(__dirname, 'assets/actions')
var MAIN_DIR = path.resolve(__dirname, 'assets')

var config = {
	entry: [
		APP_DIR + '/app.jsx'
	],
	output: {
		path: BUILD_DIR,
		filename: 'bundle.js'
	},
	resolve: {
		extensions: ['', '.js', '.jsx']
	},
	module: {
		loaders: [
			{
				test: /\.jsx?/,
				include: [MAIN_DIR, APP_DIR, ACTIONS_DIR],
				loader: 'babel-loader',
				query: {
					presets: ['es2015', 'react']
				}
			}
		]
	}
}

module.exports = config

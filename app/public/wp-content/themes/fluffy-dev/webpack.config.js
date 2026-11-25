const path = require('path');
const defaultConfig = require('@wordpress/scripts/config/webpack.config');

module.exports = {
	...defaultConfig,
	entry: {
		auth: path.resolve(__dirname, 'src/react/auth/index.js'),
		profile: path.resolve(__dirname, 'src/react/profile/index.js'),
		booking: path.resolve(__dirname, 'src/react/booking/index.js'),
		operations: path.resolve(__dirname, 'src/react/operations/index.js'),
		dashboard: path.resolve(__dirname, 'src/react/dashboard/index.js'),
		admin: path.resolve(__dirname, 'src/react/admin/index.js'),
	},
	output: {
		...defaultConfig.output,
		path: path.resolve(__dirname, 'build/react'),
		filename: '[name].js',
	},
};

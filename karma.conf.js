/* jshint node: true */
module.exports = function(config) {
    'use strict';

    config.set({
        port: 9877,
        reporters: ['dots'],
        browsers: ['PhantomJS'],
        frameworks: ['jasmine'],
        files: [
            require.resolve('babel-polyfill/browser'),
            'dist/telegram.min.js',
            'test/**/*.spec.js'
        ],
        preprocessors: {
            'test/**/*.js': ['babel']
        }
    });
};

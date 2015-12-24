/* jshint node: true */
'use strict';

var gulp = require('gulp'),
    version = require('./package.json').version;

function buildRelease() {
    var uglify = require('gulp-uglify'),
        multipipe = require('multipipe'),
        babel = require('gulp-babel'),
        concat = require('gulp-concat'),
        rename = require('gulp-rename'),
        wrap = require('gulp-wrap'),
        wrapper = require('fs').readFileSync(__dirname + '/build.template.js', 'utf8');

    wrapper = wrapper.replace('/* content goes here */', '<' + '%= contents %>');
    console.log('Building version ' + version);

    multipipe(
        gulp.src('src/**/*.js'),
        concat('telegram.js'),
        babel(),
        wrap(wrapper),
        gulp.dest('dist'),
        uglify(),
        rename({
            suffix: '.min'
        }),
        gulp.dest('dist'),
        onError
    );
}

function onError(err) {
    if (err) {
        console.warn('ERROR: ' + err.message || err);
        if (err.stack) console.log(err.stack);
        return;
    }

    console.log('Done.');
}

gulp.task('build', buildRelease);

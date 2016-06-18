'use strict';

var gulp = require('gulp'),
    header = require('gulp-header'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    gulpCopy = require('gulp-copy'),
    rename = require('gulp-rename'),
    jade = require('gulp-jade'),
    less = require('gulp-less'),
    minify = require('gulp-minify-css'),
    modernizr = require('gulp-modernizr'),
    watch = require('gulp-watch'),
    pkg = require('./package.json');

var banner = ['/**',
    ' * <%= pkg.name %> - <%= pkg.description %>',
    ' * @version v<%= pkg.version %>',
    ' * @link <%= pkg.homepage %>',
    ' * @license <%= pkg.license %>',
    ' */',
    ''].join('\n');

//
//
// JS building

gulp.task('modernizr', function () {
    return gulp.src('./src/**/*.js')
        .pipe(modernizr('modernizr-custom.min.js', {
            "extra": {
                "shiv": false,
                "load": false,
                "cssclasses": false
            },
            "uglify": true,
            "tests": ['fontface', 'localstorage', 'canvas', 'hashchange'],
            "parseFiles": true,
            "matchCommunityTests": false,
            "customTests": []
        }))
        .pipe(gulp.dest("lib/modernizr"));
});

gulp.task('js-deps', ['modernizr'], function () {
    return gulp.src([
            'bower_components/ng-file-upload/ng-file-upload-shim.min.js',
            'lib/modernizr/modernizr-custom.min.js',
            'bower_components/angular/angular.min.js',
            'bower_components/angular-sanitize/angular-sanitize.min.js',
            'bower_components/showdown/compressed/Showdown.min.js',
            'bower_components/angular-bootstrap/ui-bootstrap.min.js',
            'bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js',
            'bower_components/angular-route/angular-route.min.js',
            'bower_components/angular-animate/angular-animate.min.js',
            'bower_components/angular-busy/angular-busy.js',
            'bower_components/ng-file-upload/ng-file-upload.min.js',
            'bower_components/Chart.js/Chart.js',
            'bower_components/angular-chart.js/dist/angular-chart.js',
            'bower_components/angular-markdown-directive/markdown.js',
            'bower_components/async/lib/async.js',
            'bower_components/bvh/bvh.min.js',
            'bower_components/tock/tock.min.js',
            'bower_components/Papa-Parse/papaparse.min.js'
            //'bower_components/piecemeta-apiclient/dist/piecemeta-apiclient.web.min.js'
        ])
        .pipe(concat('piecemeta-angular-dependencies.min.js'))
        .pipe(header(banner, {pkg: pkg}))
        .pipe(gulp.dest('./dist/web/js/'))
        .pipe(gulp.dest('./dist/nw/approot/js/'));
});

function jsPipe(src, destPath) {
    return src.pipe(concat('piecemeta-angular-frontend.js'))
        .pipe(header(banner, {pkg: pkg}))
        .pipe(gulp.dest(destPath))
        .pipe(rename({
            extname: ".min.js"
        }))
        .pipe(uglify())
        .pipe(header(banner, {pkg: pkg}))
        .pipe(gulp.dest(destPath));
}

gulp.task('js-web', function () {
    return jsPipe(gulp.src([
            'configuration.js',
            './src/shared/js/**/*.js',
            './src/web/js/**/*.js'
        ]), './dist/web/js/');
});

gulp.task('js-nw', function () {
    return jsPipe(gulp.src([
            'configuration.js',
            './src/shared/js/**/*.js',
            './src/nw/js/**/*.js'
        ]), './dist/nw/approot/js/');
});


//
//
// CSS building

function cssPipe(src, destPath) {
    return src.pipe(less())
        .pipe(minify())
        .pipe(header(banner, {pkg: pkg}))
        .pipe(rename({
            basename: 'piecemeta-frontend'
        }))
        .pipe(gulp.dest(destPath));
}

gulp.task('css-web', function () {
    return cssPipe(gulp.src('./src/web/less/site.less'), './dist/web/css/');
});

gulp.task('css-nw', function () {
    return cssPipe(gulp.src('./src/nw/less/app.less'), './dist/nw/approot/css/');
});


//
//
// HTML building

function htmlPipe(src, destPath) {
    return src.pipe(jade())
        .pipe(gulp.dest(destPath));
}

gulp.task('html-web', function () {
    return htmlPipe(gulp.src(['./src/shared/jade/**/*.jade', './src/web/jade/**/*.jade']), './dist/web/');

});

gulp.task('html-nw', function () {
    return htmlPipe(gulp.src(['./src/shared/jade/**/*.jade', './src/nw/jade/**/*.jade']), './dist/nw/approot/');
});


//
//
// NW app

gulp.task('build-webkit-app', function (cb) {
    var NwBuilder = require('node-webkit-builder');
    var nw = new NwBuilder({
        files: './dist/nw/**/**',
        platforms: ['osx64'],
        buildDir: './build/nw/',
        version: '0.12.1',
        appVersion: pkg.version,
        macPlist: {
            'NSHumanReadableCopyright': "2015 PieceMeta"
        }
    });
    nw.on('log', console.log);
    nw.build(function (err) {
        cb(err);
    });
});


//
//
// Copy tasks

function copyPipe(src, destPath, prefix) {
    return src.pipe(gulpCopy(destPath, {prefix: prefix}));
}

gulp.task('copy-requirejs', function () {
    return copyPipe(gulp.src(['./bower_components/requirejs/require.js']), './dist/web/js/', 2);
});

gulp.task('copy-js-src', function () {
    return copyPipe(gulp.src(['./src/**/*.js']), './dist/web/src/', 1);
});

gulp.task('copy-js-config', function () {
    return copyPipe(gulp.src(['./configuration.js']), './dist/web/js/');
});

gulp.task('copy-apiclient', function () {
    return copyPipe(gulp.src(['./bower_components/piecemeta-apiclient/dist/piecemeta-apiclient.web.js']), './dist/web/js/', 3);
});


//
//
// Watch tasks

gulp.task('watch-web', function () {
    watch(['src/web/js/**/*.js', 'src/shared/js/**/*.js', 'configuration.js'], function () {
        gulp.start('js-web');
    });
    watch('src/web/less/**/*.less', function () {
        gulp.start('css-web');
    });
    watch(['src/web/jade/**/*.jade', 'src/shared/jade/**/*.jade'], function () {
        gulp.start('html-web');
    });
});

gulp.task('watch-web-src', function () {
    watch(['src/web/js/**/*.js', 'src/shared/js/**/*.js', 'configuration.js'], function () {
        gulp.start('copy-js-src');
    });
});


//
//
// combined tasks

gulp.task('web', [
    'js-deps',
    //'js-web',
    'css-web',
    'html-web',
    'copy-requirejs',
    'copy-apiclient',
    'copy-js-src',
    'copy-js-config'
]);

gulp.task('node-webkit', [
    'js-deps',
    'js-nw',
    'css-nw',
    'html-nw'
]);

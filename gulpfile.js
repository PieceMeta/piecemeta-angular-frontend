var gulp = require('gulp');
var header = require('gulp-header');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var jade = require('gulp-jade');
var less = require('gulp-less');
var minify = require('gulp-minify-css');

var pkg = require('./package.json');
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

gulp.task('js-deps', function () {
    return gulp.src([
            'bower_components/ng-file-upload/angular-file-upload-html5-shim.min.js',
            'lib/modernizr/modernizr-custom.min.js',
            'bower_components/angular/angular.min.js',
            'bower_components/angular-sanitize/angular-sanitize.min.js',
            'bower_components/showdown/compressed/Showdown.min.js',
            'bower_components/angular-bootstrap/ui-bootstrap.min.js',
            'bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js',
            'bower_components/angular-route/angular-route.min.js',
            'bower_components/angular-animate/angular-animate.min.js',
            'bower_components/angular-busy/angular-busy.js',
            'bower_components/ng-file-upload/angular-file-upload.min.js',
            'bower_components/Chart.js/Chart.min.js',
            'bower_components/ng-chartjs/src/js/main.js',
            'bower_components/angular-markdown-directive/markdown.js',
            'bower_components/async/lib/async.js',
            'bower_components/bvh/bvh.min.js',
            'bower_components/Papa-Parse/papaparse.min.js',
            'bower_components/piecemeta-apiclient/dist/piecemeta-apiclient.web.min.js'
        ])
        .pipe(concat('piecemeta-angular-dependencies.min.js'))
        .pipe(header(banner, {pkg: pkg}))
        .pipe(gulp.dest('./dist/web/js/'))
        .pipe(gulp.dest('./dist/nw/approot/js/'));
});

gulp.task('js-web', function () {
    return gulp.src([
            'configuration.js',
            './src/shared/js/**/*.js',
            './src/web/js/**/*.js'
        ])
        .pipe(concat('piecemeta-angular-frontend.js'))
        .pipe(header(banner, {pkg: pkg}))
        .pipe(gulp.dest('./dist/web/js/'))
        .pipe(rename({
            extname: ".min.js"
        }))
        .pipe(uglify())
        .pipe(header(banner, {pkg: pkg}))
        .pipe(gulp.dest('./dist/web/js/'));
});

gulp.task('js-nw', function () {
    return gulp.src([
            'configuration.js',
            './src/shared/js/**/*.js',
            './src/nw/js/**/*.js'
        ])
        .pipe(concat('piecemeta-angular-frontend.js'))
        .pipe(header(banner, {pkg: pkg}))
        .pipe(gulp.dest('./dist/nw/approot/js/'))
        .pipe(rename({
            extname: ".min.js"
        }))
        .pipe(uglify())
        .pipe(header(banner, {pkg: pkg}))
        .pipe(gulp.dest('./dist/nw/approot/js/'));
});


//
//
// CSS building

gulp.task('css-web', function () {
    return gulp.src('./src/web/less/site.less')
        .pipe(less())
        .pipe(minify())
        .pipe(header(banner, {pkg: pkg}))
        .pipe(rename({
            basename: 'piecemeta-frontend'
        }))
        .pipe(gulp.dest('./dist/web/css/'));
});

gulp.task('css-nw', function () {
    return gulp.src('./src/nw/less/app.less')
        .pipe(less())
        .pipe(minify())
        .pipe(header(banner, {pkg: pkg}))
        .pipe(rename({
            basename: 'piecemeta-frontend'
        }))
        .pipe(gulp.dest('./dist/nw/approot/css/'));
});


//
//
// HTML building

gulp.task('html-web', function () {
    return gulp.src(['./src/shared/jade/**/*.jade', './src/web/jade/**/*.jade'])
        .pipe(jade())
        .pipe(gulp.dest('./dist/web/'));
});

gulp.task('html-nw', function () {
    return gulp.src(['./src/shared/jade/**/*.jade', './src/nw/jade/**/*.jade'])
        .pipe(jade())
        .pipe(gulp.dest('./dist/nw/approot/'));
});


//
//
// NW app

gulp.task('build-webkit-app', function (cb) {
    // uses ./build by default
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
// combined tasks

gulp.task('web', [
    'js-deps',
    'js-web',
    'css-web',
    'html-web'
]);

gulp.task('node-webkit', [
    'js-deps',
    'js-nw',
    'css-nw',
    'html-nw'
]);

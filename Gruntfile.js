module.exports = function (grunt) {
    'use strict';
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        less: {
            dist: {
                files: {
                    'dist/css/piecemeta-frontend.css': [
                        'src/less/site.less'
                    ]
                },
                options: {
                    compress: true,
                    sourceMap: false
                }
            }
        },
        jade: {
            compile: {
                expand: true,
                cwd: 'src/jade/',
                src: ['**/*.jade'],
                dest: 'dist/',
                ext: '.html'
            }
        },
        modernizr: {
            dist: {
                "devFile": "bower_components/modernizr/modernizr.js",
                "outputFile": "lib-build/modernizr/modernizr-custom.min.js",
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
            }
        },
        uglify: {
            js_main_app: {
                options: {
                    compress: {
                        drop_console: false
                    },
                    banner: '/*! <%= pkg.name %> main app - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> */\n\n'
                },
                files: {
                    'dist/js/piecemeta-angular-frontend.min.js': [
                        'src/js/**/*.js'
                    ]
                }
            }
        },
        concat: {
            options: {
                separator: '\n\n',
                stripBanners: { block: true },
                nonull: true,
                banner: '/*! <%= pkg.name %> dependencies - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> */\n\n'
            },
            dist: {
                src: [
                    'bower_components/ng-file-upload/angular-file-upload-html5-shim.min.js',
                    'lib-build/modernizr/modernizr-custom.min.js',
                    'bower_components/angular/angular.min.js',
                    'bower_components/angular-sanitize/angular-sanitize.min.js',
                    'bower_components/showdown/compressed/showdown.js',
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
                    'bower_components/piecemeta-apiclient/dist/piecemeta-apiclient.web.min.js',
                    'configuration.js'
                ],
                dest: 'dist/js/piecemeta-angular-dependencies.min.js'
            }
        },
        watch: {
            js: {
                files: [
                    'src/js/**/*.js'
                ],
                tasks: ['uglify']
            },
            css: {
                files: [
                    'src/less/**/*.less'
                ],
                tasks: ['less']
            },
            html: {
                files: [
                    'src/jade/**/*.jade'
                ],
                tasks: ['jade']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-jade');
    grunt.loadNpmTasks("grunt-modernizr");
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.registerTask('dev', ['default', 'watch']);

    grunt.registerTask('default', ['modernizr', 'less', 'jade', 'uglify', 'concat']);

};
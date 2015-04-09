module.exports = function (grunt) {
    'use strict';
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        less: {
            web: {
                files: {
                    'dist/web/css/piecemeta-frontend.css': [
                        'src/shared/less/site.less',
                        'src/web/less/site.less'
                    ]
                },
                options: {
                    compress: true,
                    sourceMap: false
                }
            },
            nw: {
                files: {
                    'dist/nw/approot/css/piecemeta-frontend.css': [
                        'src/shared/less/site.less',
                        'src/nw/less/site.less'
                    ]
                },
                options: {
                    compress: true,
                    sourceMap: false
                }
            }
        },
        jade: {
            web_shared: {
                expand: true,
                cwd: 'src/shared/jade/',
                src: ['**/*.jade'],
                dest: 'dist/web/',
                ext: '.html'
            },
            web_main: {
                expand: true,
                cwd: 'src/web/jade/',
                src: ['**/*.jade'],
                dest: 'dist/web/',
                ext: '.html'
            },
            nw_shared: {
                expand: true,
                cwd: 'src/shared/jade/',
                src: ['**/*.jade'],
                dest: 'dist/nw/approot/',
                ext: '.html'
            },
            nw_main: {
                expand: true,
                cwd: 'src/nw/jade/',
                src: ['**/*.jade'],
                dest: 'dist/nw/approot/',
                ext: '.html'
            }
        },
        modernizr: {
            dist: {
                "devFile": "bower_components/modernizr/modernizr.js",
                "outputFile": "lib/modernizr/modernizr-custom.min.js",
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
            web: {
                options: {
                    compress: {
                        drop_console: false
                    },
                    banner: '/*! <%= pkg.name %> main web app - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> */\n\n'
                },
                files: {
                    'dist/web/js/piecemeta-angular-frontend.min.js': [
                        'src/shared/js/**/*.js',
                        'src/web/js/**/*.js'
                    ]
                }
            },
            nw: {
                options: {
                    compress: {
                        drop_console: false
                    },
                    banner: '/*! <%= pkg.name %> main node-webkit app - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> */\n\n'
                },
                files: {
                    'dist/nw/approot/js/piecemeta-angular-frontend.min.js': [
                        'src/shared/js/**/*.js',
                        'src/nw/js/**/*.js'
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
            web: {
                src: [
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
                    'bower_components/piecemeta-apiclient/dist/piecemeta-apiclient.web.min.js',
                    'configuration.js'
                ],
                dest: 'dist/web/js/piecemeta-angular-dependencies.min.js'
            },
            nw: {
                src: [
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
                    'bower_components/tock/tock.min.js',
                    'bower_components/Papa-Parse/papaparse.min.js',
                    'bower_components/piecemeta-apiclient/dist/piecemeta-apiclient.web.min.js',
                    'configuration.js'
                ],
                dest: 'dist/nw/approot/js/piecemeta-angular-dependencies.min.js'
            }
        },
        watch: {
            web: {
                files: [
                    'src/shared/js/**/*.js',
                    'src/web/js/**/*.js',
                    'src/shared/less/**/*.less',
                    'src/web/less/**/*.less',
                    'src/shared/jade/**/*.jade',
                    'src/web/jade/**/*.jade'
                ],
                tasks: ['uglify:web', 'less:web', 'jade:web_shared', 'jade:web_main']
            },
            nw: {
                files: [
                    'src/shared/js/**/*.js',
                    'src/nw/js/**/*.js',
                    'src/shared/less/**/*.less',
                    'src/nw/less/**/*.less',
                    'src/shared/jade/**/*.jade',
                    'src/nw/jade/**/*.jade'
                ],
                tasks: ['uglify:nw', 'less:nw', 'jade:nw_shared', 'jade:nw_main']
            }
        },
        clean: {
            nw: ["build/nw"]
        },
        nodewebkit: {
            client: {
                options: {
                    platforms: ['osx64'],
                    version: '0.12.0',
                    buildDir: './build/nw',
                    macPlist: {
                        'NSHumanReadableCopyright': "2015 PieceMeta"
                    }
                },
                src: ['./dist/nw/**/*']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-jade');
    grunt.loadNpmTasks("grunt-modernizr");
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-node-webkit-builder');

    grunt.registerTask('build-nw', [
       'less:nw',
       'jade:nw_shared',
       'jade:nw_main',
       'concat:nw',
       'uglify:nw',
       'clean:nw',
       'nodewebkit'
    ]);

    grunt.registerTask('build-web', [
        'modernizr',
        'less:web',
        'jade:web_shared',
        'jade:web_main',
        'concat:web',
        'uglify:web'
    ]);

    grunt.registerTask('default', ['build-web']);

};
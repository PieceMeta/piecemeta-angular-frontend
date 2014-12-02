module.exports = function (grunt) {
    'use strict';
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        less: {
            dist: {
                files: {
                    'dist/css/piecemeta-site.css': [
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
                dest: 'dist/html/',
                ext: '.html'
            }
        },
        uglify: {
            js_dependencies: {
                options: {
                    compress: {
                        drop_console: false
                    },
                    banner: '/*! <%= pkg.name %> app dependencies - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> */'
                },
                files: {
                    'dist/js/piecemeta-web-dep.min.js': [
                        'bower_components/ng-file-upload/angular-file-upload-html5-shim.js',
                        'modernizr-custom.js',
                        'bower_components/angularjs/angular.js',
                        'bower_components/angular-sanitize/angular-sanitize.js',
                        'bower_components/showdown/src/showdown.js',
                        'bower_components/angular-bootstrap/ui-bootstrap.js',
                        'bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
                        'bower_components/angular-route/angular-route.js',
                        'bower_components/angular-animate/angular-animate.js',
                        'bower_components/angular-busy/angular-busy.js',
                        'bower_components/ng-file-upload/angular-file-upload.js',
                        'bower_components/Chart.js/Chart.js',
                        'bower_components/ng-chartjs/src/js/main.js'
                    ]
                }
            },
            js_main_app: {
                options: {
                    compress: {
                        drop_console: false
                    },
                    banner: '/*! <%= pkg.name %> main app - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> */'
                },
                files: {
                    'dist/js/piecemeta-web.min.js': [
                        'src/js/**/*.js'
                    ]
                }
            }
        },
        modernizr: {

            dist: {
                // [REQUIRED] Path to the build you're using for development.
                "devFile": "bower_components/modernizr/modernizr.js",

                // [REQUIRED] Path to save out the built file.
                "outputFile": "modernizr-custom.js",

                // Based on default settings on http://modernizr.com/download/
                "extra": {
                    "shiv": false,
                    "load": false,
                    "cssclasses": false
                },

                // By default, source is uglified before saving
                "uglify": false,

                // Define any tests you want to implicitly include.
                "tests": ['fontface','localstorage','canvas','hashchange'],

                // By default, this task will crawl your project for references to Modernizr tests.
                // Set to false to disable.
                "parseFiles": true,

                // When parseFiles = true, this task will crawl all *.js, *.css, *.scss files, except files that are in node_modules/.
                // You can override this by defining a "files" array below.
                // "files" : {
                // "src": []
                // },

                // When parseFiles = true, matchCommunityTests = true will attempt to
                // match user-contributed tests.
                "matchCommunityTests": false,

                // Have custom Modernizr tests? Add paths to their location here.
                "customTests": []
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

    grunt.registerTask('dev', ['default', 'watch']);

    grunt.registerTask('default', ['modernizr', 'less', 'jade', 'uglify']);

};
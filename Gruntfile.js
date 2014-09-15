/*global module*/
module.exports = function (grunt) {
    "use strict";
    //Load Tasks
    grunt.loadNpmTasks('grunt-string-replace');
    grunt.loadNpmTasks('grunt-jslint');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-curl');
    grunt.loadNpmTasks('grunt-zip');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    //Config Tasks
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: {
            HostedWebApp: {
                src: ['build/webapp']
            },
            FirefoxPackagedApp: {
                src: ['build/packagedapp/temp']
            }
        },
        'string-replace': { // configure the string replacement task for the hostet app
            HostedWebApp: {
                files: [
                    {src: 'sources/webapp/podcatcher.html',         dest: 'build/webapp/podcatcher.html'},
                    {src: 'sources/webapp/settings.html',           dest: 'build/webapp/settings.html'},
                    {src: 'sources/webapp/diagnostic.html',         dest: 'build/webapp/diagnostic.html'},
                    {src: 'sources/webapp/scripts/normalise.js',    dest: 'build/webapp/scripts/normalise.js'},
                    {src: 'sources/webapp/scripts/lowLevelApi.js',  dest: 'build/webapp/scripts/lowLevelApi.js'},
                    {src: 'sources/webapp/scripts/globalUi.js',     dest: 'build/webapp/scripts/globalUi.js'},
                    {src: 'sources/webapp/scripts/playlist.js',   dest: 'build/webapp/scripts/playlist.js'},
                    {src: 'sources/webapp/scripts/settings.js',     dest: 'build/webapp/scripts/settings.js'},
                    {src: 'sources/webapp/scripts/diagnostic.js',   dest: 'build/webapp/scripts/diagnostic.js'},
                    {src: 'sources/webapp/appcache.manifest',       dest: 'build/webapp/appcache.manifest'},
                    {src: 'sources/hostedapp/manifest.webapp',      dest: 'build/webapp/manifest.webapp'},
                    {src: 'sources/hostedapp/install.html',         dest: 'build/webapp/install.html'}
                ],
                options: {
                    replacements: [{
                        pattern: /\{\{ VERSION \}\}/g,
                        replacement: '<%= pkg.version %>'
                    }, {
                        pattern: /\{\{ VARIANT \}\}/g,
                        replacement: 'H'
                    }]
                }
            },
            FirefoxPackagedApp: { // configure the string replacement task for the packaged app
                files: [
                    {src: 'sources/webApp/podcatcher.html',        dest: 'build/packagedapp/temp/podcatcher.html'},
                    {src: 'sources/webApp/settings.html',          dest: 'build/packagedapp/temp/settings.html'},
                    {src: 'sources/webApp/scripts/normalise.js',   dest: 'build/packagedapp/temp/scripts/normalise.js'},
                    {src: 'sources/webApp/scripts/lowLevelApi.js', dest: 'build/packagedapp/temp/scripts/lowLevelApi.js'},
                    {src: 'sources/webapp/scripts/globalUi.js',    dest: 'build/packagedapp/temp/scripts/globalUi.js'},
                    {src: 'sources/webApp/scripts/playlist.js',  dest: 'build/packagedapp/temp/scripts/playlist.js'},
                    {src: 'sources/webapp/scripts/settings.js',    dest: 'build/packagedapp/temp/scripts/settings.js'},
                    {src: 'sources/packagedapp/manifest.webapp',   dest: 'build/packagedapp/temp/manifest.webapp'},
                    {src: 'sources/packagedapp/package.manifest',  dest: 'build/packagedapp/package.manifest'},
                    {src: 'sources/packagedapp/install.html',      dest: 'build/packagedapp/install.html'}
                ],
                options: {
                    replacements: [
                        {
                            pattern: /\{\{ VERSION \}\}/g,
                            replacement: '<%= pkg.version %>'
                        },
                        {
                            pattern: /\{\{ VARIANT \}\}/g,
                            replacement: 'F'
                        },
                        { //remove App-Cache from Packaged apps
                            pattern: / manifest="appcache\.manifest"/g,
                            replacement: ''
                        }]
                }
            }
        },
        copy: {
            HostedWebApp: {
                files: [
                    // includes files within path
                    {expand: true,  cwd: 'sources/webapp/',    src: ['css/*.css'],                    dest: 'build/webapp/',             filter: 'isFile'},
                    {expand: true,  cwd: 'sources/webapp/',    src: ['img/*.png'],                    dest: 'build/webapp/',             filter: 'isFile'},
                    {expand: true,  cwd: 'sources/hostedapp/', src: ['img/*.png'],                    dest: 'build/webapp/',             filter: 'isFile'},
                    {expand: true,  cwd: 'sources/hostedapp/', src: ['scripts/*.js'],                 dest: 'build/webapp/',             filter: 'isFile'},
                    {expand: true,  cwd: 'sources/webapp/',    src: ['*.py'],                         dest: 'build/webapp/',             filter: 'isFile'},
                    {expand: false,                            src: 'sources/webapp/img/favicon.ico', dest: 'build/webapp/favicon.ico'},
                    {expand: false,                            src: 'sources/webapp/.htaccess',       dest: 'build/webapp/.htaccess'}
                ]
            },
            FirefoxPackagedApp: {
                files: [
                    {expand: true,  cwd: 'sources/webapp/',      src: ['css/*.css'],                    dest: 'build/packagedapp/temp/',            filter: 'isFile'},
                    {expand: true,  cwd: 'sources/webapp/',      src: ['img/*.png'],                    dest: 'build/packagedapp/temp/',            filter: 'isFile'},
                    {expand: true,  cwd: 'sources/packagedapp/', src: ['img/*.png'],                    dest: 'build/packagedapp/temp/',            filter: 'isFile'},
                    {expand: false, cwd: 'sources/webapp/',      src: 'sources/webapp/img/favicon.ico', dest: 'build/packagedapp/temp/favicon.ico', filter: 'isFile'},
                    {expand: true,  cwd: 'sources/packagedapp/', src: ['scripts/*.js'],                 dest: 'build/packagedapp/',                 filter: 'isFile'}
                ]
            }
        },
        curl: {
            HostedWebApp: {
                src: 'http://code.jquery.com/jquery-2.1.1.min.js',
                dest: 'build/webapp/scripts/jquery.min.js'
            },
            FirefoxPackagedApp: {
                src: 'http://code.jquery.com/jquery-2.1.1.min.js',
                dest: 'build/packagedapp/temp/scripts/jquery.min.js'
            }
        },
        zip: {
            FirefoxPackagedApp: {
                cwd: 'build/packagedapp/temp/',
                src: ['build/packagedapp/temp/**'],
                dest: 'build/packagedapp/html5podcatcher.zip'
            }
        },
        jslint: { // configure the jslint task
            client: { // lint your project's client code
                src: [
                    'gruntfile.js',
                    'sources/webapp/scripts/*.js',
                    'sources/hostedapp/scripts/*.js'
                ],
                exclude: [
                    'sources/webapp/scripts/*min.js'
                ],
                directives: {
                    browser: true,
                    plusplus: true,
                    predef: []
                },
                options: {
                    failOnError : false,
                    junit: 'tests/jslint.result.xml'
                }
            }
        },
        jasmine: {
            client: {
                src: 'sources/webapp/scripts/lowLevelApi.js',
                options: {
                    specs: 'tests/spec/lowLevelApiSpec.js',
                    junit: {
                        path: 'tests/jasmine.result',
                        consolidate: true
                    }
                }
            }
        }
    });
    //Register Tasks
    grunt.registerTask('HostedWebApp',       ['clean:HostedWebApp', 'string-replace:HostedWebApp', 'copy:HostedWebApp', 'curl:HostedWebApp']);
    grunt.registerTask('FirefoxPackagedApp', ['string-replace:FirefoxPackagedApp', 'copy:FirefoxPackagedApp', 'curl:FirefoxPackagedApp', 'zip:FirefoxPackagedApp', 'clean:FirefoxPackagedApp']);
    grunt.registerTask('test',               ['jslint', 'jasmine']);
    grunt.registerTask('default',            ['test', 'HostedWebApp', 'FirefoxPackagedApp']);
};
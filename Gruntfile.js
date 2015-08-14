/*global module*/
module.exports = function (grunt) {
    "use strict";
    //Load Tasks
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-csslint');
    grunt.loadNpmTasks('grunt-concat-css');
    grunt.loadNpmTasks('grunt-string-replace');
    grunt.loadNpmTasks('grunt-curl');
    grunt.loadNpmTasks('grunt-zip');
    grunt.loadNpmTasks('grunt-html');
    grunt.loadNpmTasks('grunt-jslint');
    grunt.loadNpmTasks('grunt-usemin');
    grunt.loadNpmTasks('grunt-autoprefixer');
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
                    {cwd: 'sources/webapp/', src: '*.html',          dest: 'build/webapp/', expand: 'true'},
                    {cwd: 'sources/webapp/', src: 'scripts/**/*.js', dest: 'build/webapp/', expand: 'true'},
                    {src: 'sources/webapp/manifest.appcache',        dest: 'build/webapp/manifest.appcache'},
                    {src: 'sources/hostedapp/manifest.webapp',       dest: 'build/webapp/manifest.webapp'},
                    {src: 'sources/hostedapp/install.html',          dest: 'build/webapp/install.html'}
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
                    {cwd: 'sources/webApp/', src: ['*.html', '!diagnostic.html'],                dest: 'build/packagedapp/temp/', expand: 'true' },
                    {cwd: 'sources/webApp/', src: ['scripts/**/*.js', '!scripts/diagnostic.js', '!scripts/storage/fileSystemProvider.js', '!scripts/storage/webStorageProvider.js'], dest: 'build/packagedapp/temp/', expand: 'true'},
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
                            pattern: / manifest="manifest\.appcache"/g,
                            replacement: ''
                        }]
                }
            }
        },
        copy: {
            HostedWebApp: {
                files: [
                    // includes files within path {expand: true,  cwd: 'sources/webapp/',    src: ['styles/*.css'],                    dest: 'build/webapp/',             filter: 'isFile'},
                    {expand: true,  cwd: 'sources/webapp/',    src: ['styles/icons/*.svg'],              dest: 'build/webapp/',             filter: 'isFile'},
                    {expand: true,  cwd: 'sources/webapp/',    src: ['images/*.png'],                    dest: 'build/webapp/',             filter: 'isFile'},
                    {expand: true,  cwd: 'sources/hostedapp/', src: ['images/*.png'],                    dest: 'build/webapp/',             filter: 'isFile'},
                    {expand: true,  cwd: 'sources/hostedapp/', src: ['scripts/*.js'],                    dest: 'build/webapp/',             filter: 'isFile'},
                    {expand: true,  cwd: 'sources/webapp/',    src: ['*.py'],                            dest: 'build/webapp/',             filter: 'isFile'},
                    {expand: false,                            src: 'sources/webapp/images/favicon.ico', dest: 'build/webapp/favicon.ico'},
                    {expand: false,                            src: 'sources/webapp/.htaccess',          dest: 'build/webapp/.htaccess'}
                ]
            },
            FirefoxPackagedApp: {
                files: [
                    {expand: true,  cwd: 'sources/webapp/',      src: ['styles/icons/*.svg'],              dest: 'build/packagedapp/temp/',            filter: 'isFile'},
                    {expand: true,  cwd: 'sources/webapp/',      src: ['images/*.png'],                    dest: 'build/packagedapp/temp/',            filter: 'isFile'},
                    {expand: true,  cwd: 'sources/packagedapp/', src: ['images/*.png'],                    dest: 'build/packagedapp/temp/',            filter: 'isFile'},
                    {expand: false, cwd: 'sources/webapp/',      src: 'sources/webapp/images/favicon.ico', dest: 'build/packagedapp/temp/favicon.ico', filter: 'isFile'},
                    {expand: true,  cwd: 'sources/packagedapp/', src: ['scripts/*.js'],                    dest: 'build/packagedapp/',                 filter: 'isFile'}
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
        concat: {
            'HostedWebApp-css': {
                'src': ['sources/webapp/styles/*.css'],
                'dest': 'build/webapp/styles/main.css'
            },
            'FirefoxPackagedApp-css': {
                'src': ['sources/webapp/styles/*.css'],
                'dest': 'build/packagedapp/temp/styles/main.css'
            }
        },
        usemin: {
            HostedWebApp: ['build/webapp/*.html'],
            FirefoxPackagedApp: ['build/packagedapp/temp/*.html'],
            options: {
            }
        },
        autoprefixer: {
            HostedWebApp: {
                options: {
                    browsers: ['ff >= 28', 'ie >= 10', 'last 2 versions'] //Gecko[=Firefox] 28 is used in FirefoxOS 1.3
                },
                src: 'build/webapp/styles/main.css',
                dest: 'build/webapp/styles/main.css'
            },
            FirefoxPackagedApp: {
                options: {
                    browsers: ['ff >= 28'] //Gecko[=Firefox] 28 is used in FirefoxOS 1.3
                },
                src: 'build/packagedapp/temp/styles/main.css',
                dest: 'build/packagedapp/temp/styles/main.css'
            }
        },
        //Test and Lint files
        jslint: {
            client: { // lint your project's client code
                src: [
                    'gruntfile.js',
                    'sources/webapp/scripts/*.js',
                    'sources/webapp/scripts/storage/*.js',
                    'sources/hostedapp/scripts/*.js'
                ],
                exclude: [
                    'sources/webapp/scripts/*min.js'
                ],
                directives: {
                    browser: true, //Assume a browser and his global namespaces and objects
                    plusplus: true, //allow usage of i++ and ++i operators
                    todo: true, //allow usage of TODO comments
                    predef: []
                },
                options: {
                    edition: 'latest',
                    failOnError : false,
                    junit: 'tests/jslint.result.xml'
                }
            }
        },
        csslint: {
            options: {
                'fallback-colors': false,
                'box-sizing': false,
                'unqualified-attributes': true,
                'universal-selector': true,
                'overqualified-elements': true,
                'ids': false,
                formatters: [
                    {id: 'junit-xml', dest: 'tests/csslint.result.junit.xml'},
                    {id: 'text', dest: 'tests/csslint.result.txt'}
                ]
            },
            client: {
                src: [
                    'sources/webapp/styles/*.css', // Include all CSS files in this directory.
                    'sources/webapp/styles/' + '!*.min.css' // Exclude any files ending with `.min.css`
                ]
            }
        },
        htmllint: {
            client: {
                options: {
                    ignore: [ 'The “menu” element is not supported by browsers yet. It would probably be better to wait for implementations.'],
                    reporter: 'checkstyle',
                    reporterOutput: 'tests/htmllint.result.txt'
                },
                src: [
                    'sources/webapp/*.html'
                ]
            }
        },
        jasmine: {
            client: {
                src: [
                    'sources/webapp/scripts/*.js',
                    'sources/webapp/scripts/storage/*.js',
                    'http://code.jquery.com/jquery-2.1.1.min.js'
                ],
                options: {
                    specs: [
                        'tests/spec/*.js'
                    ],
                    junit: {
                        path: 'tests/jasmine.result',
                        consolidate: true
                    }
                }
            }
        }
    });
    //Register Tasks
    grunt.registerTask('HostedWebApp',       ['clean:HostedWebApp', 'string-replace:HostedWebApp', 'concat:HostedWebApp-css', 'autoprefixer:HostedWebApp', 'copy:HostedWebApp', 'curl:HostedWebApp', 'usemin:HostedWebApp']);
    grunt.registerTask('FirefoxPackagedApp', ['string-replace:FirefoxPackagedApp', 'concat:FirefoxPackagedApp-css', 'autoprefixer:FirefoxPackagedApp', 'usemin:FirefoxPackagedApp', 'copy:FirefoxPackagedApp', 'curl:FirefoxPackagedApp', 'zip:FirefoxPackagedApp']); //, 'clean:FirefoxPackagedApp'
    grunt.registerTask('test',               ['htmllint', 'csslint', 'jslint', 'jasmine']);
    grunt.registerTask('default',            ['test', 'HostedWebApp', 'FirefoxPackagedApp']);
};
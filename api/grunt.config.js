/*global module*/
module.exports = function (grunt) {
    "use strict";
    //Load Tasks
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-jslint');
    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.loadNpmTasks('grunt-rollup');
    //Config Tasks
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        //Test and Lint files
        jslint: {
            client: { // lint your project's client code
                src: [
                    'grunt.config.js',
                    'rollup.config.js',
                    'sources/**/*.js'
                ],
                exclude: [],
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
        jasmine: {
            client: {
                src: [
                    'sources/*.js'
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
        },
        jsdoc : {
            dist : {
                src: ['sources/**/*.js'],
                options: {
                    destination: 'documentation',
                    'private':   true,
                    'package':   'package.json',
                    'readme':    'README.md'
                }
            }
        },
        rollup: {
            options: {
                format:     'iife',
                sourceMap:  'inline',
                moduleName: 'html5podcatcher'
            },
            files: {
                'dest': 'build/html5podcatcher.js',
                'src' : 'sources/api.js'
            }
        }
    });
    //Register Tasks
    grunt.registerTask('test',               ['jslint', 'jasmine']);
    grunt.registerTask('doc',                ['jsdoc']);
    grunt.registerTask('build',              ['rollup']);
    grunt.registerTask('default',            ['test', 'rollup', 'doc']);
};
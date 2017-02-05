/*global module*/
module.exports = function (grunt) {
    "use strict";
    //Load Tasks
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-jslint');
	grunt.loadNpmTasks('grunt-jsdoc');
    //Config Tasks
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
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
		jsdoc : {
			dist : {
				src: ['sources/*.js'],
				options: {
					destination: 'documentation'
				}
			}
		}
	});
    //Register Tasks
    grunt.registerTask('test',               ['jslint', 'jasmine']);
	grunt.registerTask('documentation'       ['jsdoc']);
    grunt.registerTask('default',            ['test', 'documentation']);
};
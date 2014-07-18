module.exports = function(grunt) {
    //Load Tasks
    grunt.loadNpmTasks('grunt-string-replace');
    grunt.loadNpmTasks('grunt-jslint');
    //Config Tasks
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        'string-replace': { // configure the string replacement task
            version: {
                files: {
                    'build/podcatcher.html': 'podcatcher.html',
                    'build/scripts/podcatcher.js': 'scripts/podcatcher.js',
                    'build/cache-manifest.manifest': 'cache-manifest.manifest'
                },
                options: {
                    replacements: [{
                        pattern: /{{ VERSION }}/g,
                        replacement: '<%= pkg.version %>'
                    },
                    {
                        pattern: /0.0.0/g,
                        replacement: '<%= pkg.version %>'
                    }]
                }
            }
        },
        'jslint': { // configure the jslint task
            client: { // lint your project's client code
                src: [
					'scripts/*.js'
                ],
				exclude: [
					'scripts/*min.js'
				],
                directives: {
					browser: true,
					plusplus: true,
					//white: true,
					predef: [
						'jQuery'
					]
                },
                options: {
					failOnError : false,
					//junit: 'out/client-junit.xml'
                }
            }
        }
    });
    //Register Tasks
    grunt.registerTask('default', ['jslint', 'string-replace']);
};
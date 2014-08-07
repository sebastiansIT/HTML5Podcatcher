module.exports = function(grunt) {
    //Load Tasks
    grunt.loadNpmTasks('grunt-string-replace');
    grunt.loadNpmTasks('grunt-jslint');
	grunt.loadNpmTasks('grunt-contrib-copy');
    //Config Tasks
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        'string-replace': { // configure the string replacement task
            version: {
                files: {
                    'build/podcatcher.html': 'podcatcher.html',
                    'build/scripts/normalise.js': 'scripts/normalise.js',
					'build/scripts/podcatcher.js': 'scripts/podcatcher.js',
                    'build/cache-manifest.manifest': 'cache-manifest.manifest'
                },
                options: {
                    replacements: [{
                        pattern: /{{ VERSION }}/g,
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
        },
		'copy': {
			main: {
				files: [
				  // includes files within path
				  {expand: true, src: ['css/*.css'], dest: 'build/', filter: 'isFile'},
				  {expand: true, src: ['img/*.png'], dest: 'build/', filter: 'isFile'},
				  {expand: true, src: ['scripts/*min.js'], dest: 'build/', filter: 'isFile'},
				  {src: 'img/favicon.ico', dest: 'build/favicon.ico'},
				  {src: '.htaccess', dest: 'build/.htaccess'},
				  {expand: true, src: ['manifest.webapp'], dest: 'build/', filter: 'isFile'},
				  {expand: true, src: ['*.py'], dest: 'build/', filter: 'isFile'}
				]
			}
		}
    });
    //Register Tasks
    grunt.registerTask('default', ['jslint', 'copy', 'string-replace']);
};
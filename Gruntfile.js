module.exports = function(grunt) {
    //Load Tasks
    grunt.loadNpmTasks('grunt-string-replace');
    grunt.loadNpmTasks('grunt-jslint');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-curl');
    grunt.loadNpmTasks('grunt-zip');
    
    //Config Tasks
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: {
            HostetWebApp: {
                src: ['build/webapp']
            },
            FirefoxPackagedApp: {
                src: ['build/packagedapp/temp']
            }
        },
        'string-replace': { // configure the string replacement task for the hostet app
            HostetWebApp: {
                files: [
                    {src: 'sources/webapp/podcatcher.html',        dest: 'build/webapp/podcatcher.html'},
                    {src: 'sources/webapp/scripts/normalise.js',   dest: 'build/webapp/scripts/normalise.js'},
                    {src: 'sources/webapp/scripts/lowLevelApi.js', dest: 'build/webapp/scripts/lowLevelApi.js'},
                    {src: 'sources/webapp/scripts/podcatcher.js',  dest: 'build/webapp/scripts/podcatcher.js'},
                    {src: 'sources/webapp/appcache.manifest',      dest: 'build/webapp/appcache.manifest'},
                    {src: 'sources/hostedapp/manifest.webapp',     dest: 'build/webapp/manifest.webapp'},
					{src: 'sources/hostedapp/install.html',        dest: 'build/webapp/install.html'}
                ],
                options: {
                    replacements: [
					{
						pattern: /{{ VERSION }}/g,
						replacement: '<%= pkg.version %>'
					},
					{
						pattern: /{{ VARIANT }}/g,
						replacement: 'H'
					}
                    ]
                }
            },
            FirefoxPackagedApp: { // configure the string replacement task for the packaged app
                files: [
                    {src: 'sources/webApp/podcatcher.html',        dest: 'build/packagedapp/temp/podcatcher.html'},
                    {src: 'sources/webApp/scripts/normalise.js',   dest: 'build/packagedapp/temp/scripts/normalise.js'},
                    {src: 'sources/webApp/scripts/lowLevelApi.js', dest: 'build/packagedapp/temp/scripts/lowLevelApi.js'},
                    {src: 'sources/webApp/scripts/podcatcher.js',  dest: 'build/packagedapp/temp/scripts/podcatcher.js'},
                    {src: 'sources/packagedapp/manifest.webapp',   dest: 'build/packagedapp/temp/manifest.webapp'},
                    {src: 'sources/packagedapp/package.manifest',  dest: 'build/packagedapp/package.manifest'},
                    {src: 'sources/packagedapp/install.html',      dest: 'build/packagedapp/install.html'}
                ],
                options: {
                    replacements: [
                        {
                            pattern: /{{ VERSION }}/g,
                            replacement: '<%= pkg.version %>'
                        },
						{
							pattern: /{{ VARIANT }}/g,
							replacement: 'F'
						},
                        { //remove App-Cache from Packaged apps
                            pattern: / manifest="appcache.manifest"/g,
                            replacement: ''
                        }]
                }
            }
        },
        copy: {
            HostetWebApp: {
                files: [
					// includes files within path
					{expand: true,  cwd: 'sources/webapp/',    src: ['css/*.css'],                    dest: 'build/webapp/',             filter: 'isFile'},
					{expand: true,  cwd: 'sources/webapp/',    src: ['img/*.png'],                    dest: 'build/webapp/',             filter: 'isFile'},
					{expand: true,  cwd: 'sources/hostedapp/', src: ['img/*.png'],                    dest: 'build/webapp/',        filter: 'isFile'},
					{expand: true,  cwd: 'sources/webapp/',    src: ['*.py'],                         dest: 'build/webapp/',             filter: 'isFile'},
					{expand: false,                            src: 'sources/webapp/img/favicon.ico', dest: 'build/webapp/favicon.ico'},
					{expand: false,                            src: 'sources/webapp/.htaccess',       dest: 'build/webapp/.htaccess'}
                ]
            },
            FirefoxPackagedApp: {
                files: [
                    {expand: true,  cwd: 'sources/webapp/',             src: ['css/*.css'],                                 dest: 'build/packagedapp/temp/',             filter: 'isFile'},
                    {expand: true,  cwd: 'sources/webapp/',             src: ['img/*.png'],                                 dest: 'build/packagedapp/temp/',             filter: 'isFile'},
					{expand: true,  cwd: 'sources/packagedapp/',        src: ['img/*.png'],                                 dest: 'build/packagedapp/temp/',             filter: 'isFile'},
                    {expand: false, cwd: 'sources/webapp/',             src: 'sources/webapp/img/favicon.ico',              dest: 'build/packagedapp/temp/favicon.ico',  filter: 'isFile'},
                ]
            }
        },
        curl: {
            HostetWebApp: {
                src: 'http://code.jquery.com/jquery-2.1.1.min.js',
                dest: 'build/webApp/scripts/jquery.min.js'
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
                    'sources/webapp/scripts/*.js'
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
                    junit: 'test/jslint.result.xml'
                }
            }
        }
    });
    //Register Tasks
    grunt.registerTask('HostetWebApp',       ['clean:HostetWebApp', 'string-replace:HostetWebApp', 'copy:HostetWebApp', 'curl:HostetWebApp']);
    grunt.registerTask('FirefoxPackagedApp', ['string-replace:FirefoxPackagedApp', 'copy:FirefoxPackagedApp', 'curl:FirefoxPackagedApp', 'zip:FirefoxPackagedApp']);//, 'clean:FirefoxPackagedApp']);
    grunt.registerTask('Test',               ['jslint']);
    grunt.registerTask('default',            ['Test', 'HostetWebApp', 'FirefoxPackagedApp']);
};
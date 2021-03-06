/* global module */

const JQUERY_URL = 'https://code.jquery.com/jquery-3.6.0.min.js'

module.exports = function (grunt) {
  'use strict'
  // Load Tasks
  grunt.loadNpmTasks('grunt-contrib-copy')
  grunt.loadNpmTasks('grunt-contrib-clean')
  grunt.loadNpmTasks('grunt-contrib-concat')
  grunt.loadNpmTasks('grunt-contrib-jasmine')
  grunt.loadNpmTasks('grunt-contrib-csslint')
  grunt.loadNpmTasks('grunt-concat-css')
  grunt.loadNpmTasks('grunt-string-replace')
  grunt.loadNpmTasks('grunt-curl')
  grunt.loadNpmTasks('grunt-zip')
  grunt.loadNpmTasks('grunt-html')
  grunt.loadNpmTasks('grunt-jslint')
  grunt.loadNpmTasks('grunt-usemin')
  // grunt.loadNpmTasks('grunt-autoprefixer')
  grunt.loadNpmTasks('@lodder/grunt-postcss')
  // Config Tasks
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      HostedWebApp: {
        src: ['distributions/webapp']
      },
      ChromePackagedApp: {
        src: ['distributions/chromeapp/temp']
      }
    },
    'string-replace': { // configure the string replacement task for the hostet app
      HostedWebApp: {
        files: [
          { cwd: 'sources/webapp/', src: '*.html', dest: 'distributions/webapp/', expand: 'true' },
          { cwd: 'sources/webapp/', src: ['scripts/**/*.js', 'scripts/**/*.mjs'], dest: 'distributions/webapp/', expand: 'true' },
          { src: 'sources/webapp/serviceworker.js', dest: 'distributions/webapp/serviceworker.js' }
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
      ChromePackagedApp: { // configure the string replacement task for the chrome packaged app
        files: [
          { cwd: 'sources/webApp/', src: ['*.html', '!diagnostic.html'], dest: 'distributions/chromeapp/temp/', expand: 'true' },
          { cwd: 'sources/webApp/', src: ['scripts/**/*.js', '!scripts/diagnostic.js', '!scripts/storage/webStorageProvider.js'], dest: 'distributions/chromeapp/temp/', expand: 'true' },
          { cwd: 'sources/chromeapp/', src: ['scripts/**/*.js'], dest: 'distributions/chromeapp/temp/', expand: 'true' },
          { src: 'sources/chromeapp/background.js', dest: 'distributions/chromeapp/temp/background.js' },
          { src: 'sources/chromeapp/manifest.json', dest: 'distributions/chromeapp/temp/manifest.json' }
        ],
        options: {
          replacements: [
            {
              pattern: /\{\{ VERSION \}\}/g,
              replacement: '<%= pkg.version %>'
            },
            {
              pattern: /\{\{ VARIANT \}\}/g,
              replacement: 'C'
            },
            { // remove App-Cache from Packaged apps
              pattern: / manifest="manifest\.appcache"/g,
              replacement: ''
            }
          ]
        }
      }
    },
    copy: {
      HostedWebApp: {
        files: [
          // includes files within path {expand: true,  cwd: 'sources/webapp/',    src: ['styles/*.css'],                    dest: 'distributions/webapp/',             filter: 'isFile'},
          { expand: true, cwd: 'sources/webapp/', src: ['styles/icons/*.svg'], dest: 'distributions/webapp/', filter: 'isFile' },
          { expand: true, cwd: 'sources/webapp/', src: ['images/*.png', 'images/*.svg'], dest: 'distributions/webapp/', filter: 'isFile' },
          { expand: true, cwd: 'sources/hostedapp/', src: ['images/*.png'], dest: 'distributions/webapp/', filter: 'isFile' },
          { expand: true, cwd: 'sources/hostedapp/', src: ['scripts/*.js'], dest: 'distributions/webapp/', filter: 'isFile' },
          { expand: true, cwd: 'sources/webapp/', src: ['*.py'], dest: 'distributions/webapp/', filter: 'isFile' },
          { expand: false, src: 'sources/webapp/images/favicon.ico', dest: 'distributions/webapp/favicon.ico' },
          { expand: false, src: 'sources/webapp/.htaccess', dest: 'distributions/webapp/.htaccess' },
          { expand: false, src: 'sources/webapp/manifest.webmanifest', dest: 'distributions/webapp/manifest.webmanifest' }
        ]
      },
      ChromePackagedApp: {
        files: [
          { expand: true, cwd: 'sources/webapp/', src: ['styles/icons/*.svg'], dest: 'distributions/chromeapp/temp/', filter: 'isFile' },
          { expand: true, cwd: 'sources/webapp/', src: ['images/*.png'], dest: 'distributions/chromeapp/temp/', filter: 'isFile' },
          { expand: true, cwd: 'sources/chromeapp/', src: ['images/*.png'], dest: 'distributions/chromeapp/temp/', filter: 'isFile' },
          { expand: false, cwd: 'sources/webapp/', src: 'sources/webapp/images/favicon.ico', dest: 'distributions/chromeapp/temp/favicon.ico', filter: 'isFile' }
        ]
      }
    },
    curl: {
      HostedWebApp: {
        src: JQUERY_URL,
        dest: 'distributions/webapp/scripts/jquery.min.js'
      },
      ChromePackagedApp: {
        src: JQUERY_URL,
        dest: 'distributions/chromeapp/temp/scripts/jquery.min.js'
      }
    },
    zip: {
      FirefoxPackagedApp: {
        cwd: 'distributions/packagedapp/temp/',
        src: ['distributions/packagedapp/temp/**'],
        dest: 'distributions/packagedapp/html5podcatcher.zip'
      }
    },
    concat: {
      'HostedWebApp-css': {
        src: ['sources/webapp/styles/*.css'],
        dest: 'distributions/webapp/styles/main.css'
      },
      'ChromePackagedApp-css': {
        src: ['sources/webapp/styles/*.css'],
        dest: 'distributions/chromeapp/temp/styles/main.css'
      }
    },
    usemin: {
      HostedWebApp: ['distributions/webapp/*.html'],
      ChromePackagedApp: ['distributions/chromeapp/temp/*.html'],
      options: {
      }
    },
    postcss: {
      HostedWebApp: {
        options: {
          map: false,
          processors: [
            require('autoprefixer')({
              overrideBrowserslist: ['ie >= 10', 'last 3 versions']
            })
          ]
        },
        src: 'distributions/webapp/styles/main.css',
        dest: 'distributions/webapp/styles/main.css'
      },
      ChromePackagedApp: {
        options: {
          map: false,
          processors: [
            require('autoprefixer')({
              overrideBrowserslist: ['chrome >= 37']
            })
          ]
        },
        src: 'distributions/chromeapp/temp/styles/main.css',
        dest: 'distributions/chromeapp/temp/styles/main.css'
      }
    },
    // Test and Lint files
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
          browser: true, // Assume a browser and his global namespaces and objects
          plusplus: true, // allow usage of i++ and ++i operators
          todo: true, // allow usage of TODO comments
          predef: []
        },
        options: {
          edition: 'latest',
          failOnError: false,
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
        ids: false,
        formatters: [
          { id: 'junit-xml', dest: 'tests/csslint.result.junit.xml' },
          { id: 'text', dest: 'tests/csslint.result.txt' }
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
          force: false,
          ignore: [
            'The “menu” element is not supported by browsers yet. It would probably be better to wait for implementations.',
            'The “region” role is unnecessary for element “section”.',
            'The “banner” role is unnecessary for element “header”.'
          ],
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
          'https://code.jquery.com/jquery-3.3.1.min.js'
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
  })

  // Register Tasks
  grunt.registerTask('HostedWebApp', ['clean:HostedWebApp', 'string-replace:HostedWebApp', 'concat:HostedWebApp-css', 'postcss:HostedWebApp', 'copy:HostedWebApp', 'curl:HostedWebApp', 'usemin:HostedWebApp'])
  grunt.registerTask('ChromePackagedApp', ['string-replace:ChromePackagedApp', 'concat:ChromePackagedApp-css', 'postcss:ChromePackagedApp', 'usemin:ChromePackagedApp', 'copy:ChromePackagedApp', 'curl:ChromePackagedApp']) //, 'clean:ChromePackagedApp'
  grunt.registerTask('test', ['csslint', 'jslint', 'jasmine', 'htmllint'])
  grunt.registerTask('default', ['test', 'HostedWebApp'])
}

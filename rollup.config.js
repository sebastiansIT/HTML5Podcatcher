export default [
  {
    input: './sources/webapp/scripts/api/podcatcher.js',
    output: {
      name: 'podcatcher',
      file: 'distributions/webapp/scripts/podcatcher.js',
      format: 'iife'
    }
  },
  {
    input: './sources/webapp/scripts/ui/ui.js',
    output: {
      name: 'h5p',
      file: 'distributions/webapp/scripts/h5p.js',
      format: 'iife'
    }
  }
]

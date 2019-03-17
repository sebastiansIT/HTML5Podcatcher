module.exports = {
  entry: './sources/webapp/scripts/api/podcatcher.js',
  output: {
    filename: 'podcatcher.js',
    path: __dirname + '/distributions/webapp/scripts/api'
  },
  optimization: {
    minimize: false
  }
}

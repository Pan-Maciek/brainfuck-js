module.exports = {
  ...require('./src/compile'),
  parse: require('./src/parse'),
  optimize: require('./src/optimize'),
  instructions: require('./src/instructions')
}

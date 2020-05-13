module.exports = {
  env: {
    browser: true,
    es6: true
  },
  plugins: [
    'jsdoc'
  ],
  extends: [
    'standard'
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parserOptions: {
    ecmaVersion: 11,
    sourceType: 'module'
  },
  rules: {
    "jsdoc/check-alignment": 0, // Recommended
    "jsdoc/check-examples": 1,
    "jsdoc/check-indentation": 1,
    "jsdoc/check-param-names": 1, // Recommended
    "jsdoc/check-syntax": 1,
    "jsdoc/check-tag-names": ['error', { definedTags: [''] }], // Recommended
    "jsdoc/check-types": 1, // Recommended
    "jsdoc/implements-on-classes": 1, // Recommended
    "jsdoc/match-description": 1,
    "jsdoc/no-undefined-types": 1, // Recommended
    "jsdoc/require-description": 1,
    "jsdoc/require-description-complete-sentence": 1,
    "jsdoc/require-hyphen-before-param-description": 1,
    "jsdoc/require-jsdoc": 1, // Recommended
    "jsdoc/require-param": 1, // Recommended
    "jsdoc/require-param-description": 1, // Recommended
    "jsdoc/require-param-name": 1, // Recommended
    "jsdoc/require-param-type": 1, // Recommended
    "jsdoc/require-returns": 1, // Recommended
    "jsdoc/require-returns-check": 1, // Recommended
    "jsdoc/require-returns-description": 1, // Recommended
    "jsdoc/require-returns-type": 1, // Recommended
    "jsdoc/valid-types": 1 // Recommended
  },
  settings: {
    jsdoc: {
      mode: 'jsdoc'
    }
  }
}

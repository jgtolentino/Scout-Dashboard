/**
 * Babel configuration for Scout Dashboard QA Framework
 * 
 * This enables ESM modules to work with Jest and handles
 * modern JavaScript syntax across all test files.
 */

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
      },
    ],
  ],
  // Handle CommonJS/ESM interoperability
  sourceType: 'unambiguous',
};
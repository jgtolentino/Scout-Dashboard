const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    specPattern: 'cypress/integration/*.ts',
    supportFile: false,
    baseUrl: null,
  },
})
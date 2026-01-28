/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/',
    '/__fixtures__/',
    '/test-output/',          
    '/tmp/',                  
    '/var/tmp/',              
    '.+\\.(png|jpg|css|html)$' 
  ],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  collectCoverageFrom: [
    'src/**/*.js',
  ],
  transform: {},
}

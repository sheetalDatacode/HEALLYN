/**
 * API Integration Test Runner
 * 
 * Runs all integration tests for the Healiinn backend
 * 
 * Usage:
 *   node scripts/testIntegration.js                    # Run all tests
 *   node scripts/testIntegration.js --module patient   # Run patient module tests
 *   node scripts/testIntegration.js --phase 2          # Run phase 2 tests
 */

require('dotenv').config();
const { TestSuite, makeRequest, assert } = require('./testUtils');

// Import test modules
const testDashboard = require('./tests/testDashboard');
const testProfile = require('./tests/testProfile');
// Add more test modules as they are created

/**
 * Get authentication token for a module
 */
async function getAuthToken(module, credentials) {
  const endpoint = `/${module}/auth/login`;
  
  // For OTP-based login, we need to handle it differently
  // For now, return null and tests will need to handle auth
  return null;
}

/**
 * Main test runner
 */
async function runTests(module = null, phase = null) {
  
  
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0,
    suites: [],
  };
  
  try {
    // Phase 2: Dashboard & Profile
    if (!phase || phase === '2') {
      if (!module || module === 'patient') {
        const suite = await testDashboard.runPatientTests();
        results.suites.push(suite);
        results.passed += suite.passed;
        results.failed += suite.failed;
        results.total += suite.total;
      }
      
      if (!module || module === 'doctor') {
        const suite = await testDashboard.runDoctorTests();
        results.suites.push(suite);
        results.passed += suite.passed;
        results.failed += suite.failed;
        results.total += suite.total;
      }
      
      if (!module || module === 'pharmacy') {
        const suite = await testDashboard.runPharmacyTests();
        results.suites.push(suite);
        results.passed += suite.passed;
        results.failed += suite.failed;
        results.total += suite.total;
      }
      
      if (!module || module === 'laboratory') {
        const suite = await testDashboard.runLaboratoryTests();
        results.suites.push(suite);
        results.passed += suite.passed;
        results.failed += suite.failed;
        results.total += suite.total;
      }
      
      if (!module || module === 'admin') {
        const suite = await testDashboard.runAdminTests();
        results.suites.push(suite);
        results.passed += suite.passed;
        results.failed += suite.failed;
        results.total += suite.total;
      }
      
      // Profile tests
      if (!module || module === 'patient') {
        const suite = await testProfile.runPatientTests();
        results.suites.push(suite);
        results.passed += suite.passed;
        results.failed += suite.failed;
        results.total += suite.total;
      }
      
      // Add more profile tests for other modules...
    }
    
    // Add more phases as they are implemented
    
    // Print final summary
    
    
    
    
    
    
    
    
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Test runner error:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const moduleIndex = args.indexOf('--module');
const phaseIndex = args.indexOf('--phase');
const module = moduleIndex !== -1 && args[moduleIndex + 1] ? args[moduleIndex + 1] : null;
const phase = phaseIndex !== -1 && args[phaseIndex + 1] ? parseInt(args[phaseIndex + 1]) : null;

// Run tests
runTests(module, phase);


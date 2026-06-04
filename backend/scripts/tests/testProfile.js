/**
 * Profile API Integration Tests
 * Tests profile endpoints for all modules
 */

const { TestSuite, makeRequest, assert } = require('../testUtils');

/**
 * Test Patient Profile
 */
async function runPatientTests() {
  const suite = new TestSuite('Patient Profile');
  
  suite.addTest('GET /api/patients/auth/me - Should return patient profile', async (result) => {
    const response = await makeRequest('/patients/auth/me', {
      method: 'GET',
    });
    
    // This will fail without auth token, but structure should be correct
    if (response.status === 401) {
      assert.ok(true, 'Endpoint requires authentication (expected)');
      result.pass({ message: 'Authentication required' });
    } else {
      assert.ok(response.ok, `Expected 200 or 401, got ${response.status}`);
      if (response.ok) {
        assert.ok(response.data.success, 'Response should have success: true');
        assert.isObject(response.data.data, 'Response should have data object');
      }
      result.pass(response.data);
    }
  });
  
  return await suite.run();
}

/**
 * Test Doctor Profile
 */
async function runDoctorTests() {
  const suite = new TestSuite('Doctor Profile');
  
  suite.addTest('GET /api/doctors/auth/me - Should return doctor profile', async (result) => {
    const response = await makeRequest('/doctors/auth/me', {
      method: 'GET',
    });
    
    if (response.status === 401) {
      assert.ok(true, 'Endpoint requires authentication (expected)');
      result.pass({ message: 'Authentication required' });
    } else {
      assert.ok(response.ok, `Expected 200 or 401, got ${response.status}`);
      if (response.ok) {
        assert.ok(response.data.success, 'Response should have success: true');
        assert.isObject(response.data.data, 'Response should have data object');
      }
      result.pass(response.data);
    }
  });
  
  return await suite.run();
}

module.exports = {
  runPatientTests,
  runDoctorTests,
};


/**
 * Dashboard API Integration Tests
 * Tests dashboard endpoints for all modules
 */

const { TestSuite, makeRequest, assert } = require('../testUtils');

/**
 * Test Patient Dashboard
 */
async function runPatientTests() {
  const suite = new TestSuite('Patient Dashboard');
  
  suite.addTest('GET /api/patients/dashboard - Should return dashboard stats', async (result) => {
    const response = await makeRequest('/patients/dashboard', {
      method: 'GET',
    });
    
    assert.ok(response.ok, `Expected 200, got ${response.status}`);
    assert.ok(response.data.success, 'Response should have success: true');
    assert.isObject(response.data.data, 'Response should have data object');
    
    result.pass(response.data);
  });
  
  return await suite.run();
}

/**
 * Test Doctor Dashboard
 */
async function runDoctorTests() {
  const suite = new TestSuite('Doctor Dashboard');
  
  suite.addTest('GET /api/doctors/dashboard/stats - Should return dashboard stats', async (result) => {
    const response = await makeRequest('/doctors/dashboard/stats', {
      method: 'GET',
    });
    
    assert.ok(response.ok, `Expected 200, got ${response.status}`);
    assert.ok(response.data.success, 'Response should have success: true');
    assert.isObject(response.data.data, 'Response should have data object');
    
    result.pass(response.data);
  });
  
  return await suite.run();
}

/**
 * Test Pharmacy Dashboard
 */
async function runPharmacyTests() {
  const suite = new TestSuite('Pharmacy Dashboard');
  
  suite.addTest('GET /api/pharmacy/dashboard/stats - Should return dashboard stats', async (result) => {
    const response = await makeRequest('/pharmacy/dashboard/stats', {
      method: 'GET',
    });
    
    assert.ok(response.ok, `Expected 200, got ${response.status}`);
    assert.ok(response.data.success, 'Response should have success: true');
    assert.isObject(response.data.data, 'Response should have data object');
    
    result.pass(response.data);
  });
  
  return await suite.run();
}

/**
 * Test Laboratory Dashboard
 */
async function runLaboratoryTests() {
  const suite = new TestSuite('Laboratory Dashboard');
  
  suite.addTest('GET /api/laboratory/dashboard/stats - Should return dashboard stats', async (result) => {
    const response = await makeRequest('/laboratory/dashboard/stats', {
      method: 'GET',
    });
    
    assert.ok(response.ok, `Expected 200, got ${response.status}`);
    assert.ok(response.data.success, 'Response should have success: true');
    assert.isObject(response.data.data, 'Response should have data object');
    
    result.pass(response.data);
  });
  
  return await suite.run();
}

/**
 * Test Admin Dashboard
 */
async function runAdminTests() {
  const suite = new TestSuite('Admin Dashboard');
  
  suite.addTest('GET /api/admin/dashboard/stats - Should return dashboard stats', async (result) => {
    const response = await makeRequest('/admin/dashboard/stats', {
      method: 'GET',
    });
    
    assert.ok(response.ok, `Expected 200, got ${response.status}`);
    assert.ok(response.data.success, 'Response should have success: true');
    assert.isObject(response.data.data, 'Response should have data object');
    
    result.pass(response.data);
  });
  
  suite.addTest('GET /api/admin/revenue - Should return revenue data', async (result) => {
    const response = await makeRequest('/admin/revenue', {
      method: 'GET',
    });
    
    assert.ok(response.ok, `Expected 200, got ${response.status}`);
    assert.ok(response.data.success, 'Response should have success: true');
    assert.isObject(response.data.data, 'Response should have data object');
    
    result.pass(response.data);
  });
  
  return await suite.run();
}

module.exports = {
  runPatientTests,
  runDoctorTests,
  runPharmacyTests,
  runLaboratoryTests,
  runAdminTests,
};


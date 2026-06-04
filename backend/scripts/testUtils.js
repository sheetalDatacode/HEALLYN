/**
 * Test Utilities for API Integration Testing
 * 
 * Provides helper functions for testing API endpoints
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

/**
 * Make authenticated API request
 */
async function makeRequest(endpoint, options = {}, token = null) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  
  const config = {
    ...options,
    headers,
  };
  
  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }
  
  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));
    
    return {
      ok: response.ok,
      status: response.status,
      data,
      headers: response.headers,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message,
      data: null,
    };
  }
}

/**
 * Test result structure
 */
class TestResult {
  constructor(testName) {
    this.testName = testName;
    this.passed = false;
    this.failed = false;
    this.error = null;
    this.data = null;
    this.duration = 0;
  }
  
  pass(data = null) {
    this.passed = true;
    this.data = data;
    return this;
  }
  
  fail(error) {
    this.failed = true;
    this.error = error;
    return this;
  }
}

/**
 * Test suite runner
 */
class TestSuite {
  constructor(suiteName) {
    this.suiteName = suiteName;
    this.tests = [];
    this.results = [];
  }
  
  addTest(testName, testFn) {
    this.tests.push({ name: testName, fn: testFn });
  }
  
  async run() {
    
    
    
    for (const test of this.tests) {
      const result = new TestResult(test.name);
      const startTime = Date.now();
      
      try {
        await test.fn(result);
        result.duration = Date.now() - startTime;
        
        if (!result.passed && !result.failed) {
          result.pass();
        }
      } catch (error) {
        result.fail(error.message);
        result.duration = Date.now() - startTime;
      }
      
      this.results.push(result);
      
      // Print result
      if (result.passed) {
        
      } else {
        
        if (result.error) {
          
        }
      }
    }
    
    // Print summary
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => r.failed).length;
    
    
    
    
    return {
      passed,
      failed,
      total: this.tests.length,
      results: this.results,
    };
  }
}

/**
 * Assertion helpers
 */
const assert = {
  ok(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  },
  
  equal(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  },
  
  notEqual(actual, expected, message) {
    if (actual === expected) {
      throw new Error(message || `Expected not ${expected}, got ${actual}`);
    }
  },
  
  includes(array, item, message) {
    if (!array.includes(item)) {
      throw new Error(message || `Expected array to include ${item}`);
    }
  },
  
  isObject(obj, message) {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      throw new Error(message || 'Expected object');
    }
  },
  
  isArray(arr, message) {
    if (!Array.isArray(arr)) {
      throw new Error(message || 'Expected array');
    }
  },
};

module.exports = {
  makeRequest,
  TestResult,
  TestSuite,
  assert,
  API_BASE_URL,
};


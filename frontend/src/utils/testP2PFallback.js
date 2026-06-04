/**
 * Browser-based P2P to SFU Fallback Test Utility
 * 
 * This script can be run in the browser console to test P2P fallback scenarios.
 * It provides utilities to simulate P2P failures and monitor fallback behavior.
 * 
 * Usage in Browser Console:
 *   1. Open browser console (F12)
 *   2. Copy and paste this entire script
 *   3. Run: testP2PFallback.runAllTests()
 * 
 * Or test individual scenarios:
 *   - testP2PFallback.simulateInitFailure()
 *   - testP2PFallback.simulateConnectionFailure()
 *   - testP2PFallback.monitorFallback()
 */

const testP2PFallback = {
  logs: [],
  fallbackDetected: false,
  p2pEvents: [],
  sfuEvents: [],

  /**
   * Log test messages
   */
  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, type };
    this.logs.push(logEntry);
    
    const prefix = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      test: '🧪'
    }[type] || 'ℹ️';
    
    
  },

  /**
   * Monitor socket events for fallback detection
   */
  monitorSocketEvents(socket) {
    if (!socket) {
      this.log('No socket provided for monitoring', 'error');
      return;
    }

    // Monitor all socket events
    const originalEmit = socket.emit.bind(socket);
    socket.emit = (...args) => {
      const eventName = args[0];
      
      if (eventName && eventName.includes('p2p:')) {
        this.p2pEvents.push({ event: eventName, timestamp: Date.now(), direction: 'outgoing' });
        this.log(`P2P Event (outgoing): ${eventName}`, 'info');
      }
      
      if (eventName && eventName.includes('mediasoup:')) {
        this.sfuEvents.push({ event: eventName, timestamp: Date.now(), direction: 'outgoing' });
        this.log(`SFU Event (outgoing): ${eventName}`, 'warning');
        if (!this.fallbackDetected) {
          this.fallbackDetected = true;
          this.log('SFU Fallback Detected!', 'success');
        }
      }
      
      return originalEmit(...args);
    };

    // Monitor incoming events
    socket.onAny((eventName, ...args) => {
      if (eventName && eventName.includes('p2p:')) {
        this.p2pEvents.push({ event: eventName, timestamp: Date.now(), direction: 'incoming' });
        this.log(`P2P Event (incoming): ${eventName}`, 'info');
      }
      
      if (eventName && eventName.includes('mediasoup:')) {
        this.sfuEvents.push({ event: eventName, timestamp: Date.now(), direction: 'incoming' });
        this.log(`SFU Event (incoming): ${eventName}`, 'warning');
        if (!this.fallbackDetected) {
          this.fallbackDetected = true;
          this.log('SFU Fallback Detected!', 'success');
        }
      }
    });

    this.log('Socket event monitoring started', 'success');
  },

  /**
   * Simulate P2P initialization failure
   */
  async simulateInitFailure() {
    this.log('Starting P2P initialization failure test...', 'test');
    this.reset();

    // Get socket from window or context
    const socket = window.socket || window.getSocket?.();
    if (!socket) {
      this.log('Socket not found. Make sure you are in a call context.', 'error');
      return;
    }

    this.monitorSocketEvents(socket);

    // Monitor for fallback
    const checkInterval = setInterval(() => {
      if (this.fallbackDetected) {
        clearInterval(checkInterval);
        this.log('Test Complete: SFU fallback detected after P2P init failure', 'success');
        this.printResults();
      }
    }, 1000);

    // Timeout after 30 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      if (this.fallbackDetected) {
        this.log('Test Complete: SFU fallback detected', 'success');
      } else {
        this.log('Test Complete: No SFU fallback detected (P2P may have succeeded)', 'warning');
      }
      this.printResults();
    }, 30000);
  },

  /**
   * Simulate P2P connection failure
   */
  async simulateConnectionFailure() {
    this.log('Starting P2P connection failure test...', 'test');
    this.reset();

    const socket = window.socket || window.getSocket?.();
    if (!socket) {
      this.log('Socket not found. Make sure you are in a call context.', 'error');
      return;
    }

    this.monitorSocketEvents(socket);

    // Monitor P2P connection state
    const checkP2PState = () => {
      // Try to access P2P manager from React component
      // This is a bit hacky but works for testing
      const reactRoot = document.querySelector('#root');
      if (reactRoot && reactRoot._reactInternalInstance) {
        // Try to find P2P manager in component tree
        // This would need to be adapted based on your React structure
      }
    };

    const checkInterval = setInterval(() => {
      if (this.fallbackDetected) {
        clearInterval(checkInterval);
        this.log('Test Complete: SFU fallback detected after P2P connection failure', 'success');
        this.printResults();
      }
    }, 1000);

    setTimeout(() => {
      clearInterval(checkInterval);
      if (this.fallbackDetected) {
        this.log('Test Complete: SFU fallback detected', 'success');
      } else {
        this.log('Test Complete: No SFU fallback detected', 'warning');
      }
      this.printResults();
    }, 30000);
  },

  /**
   * Monitor fallback in real-time
   */
  monitorFallback() {
    this.log('Starting fallback monitoring...', 'test');
    this.reset();

    const socket = window.socket || window.getSocket?.();
    if (!socket) {
      this.log('Socket not found. Make sure you are in a call context.', 'error');
      return;
    }

    this.monitorSocketEvents(socket);

    this.log('Monitoring active. Start a call to see fallback behavior.', 'info');
    this.log('Run testP2PFallback.printResults() to see current status.', 'info');
  },

  /**
   * Reset test state
   */
  reset() {
    this.logs = [];
    this.fallbackDetected = false;
    this.p2pEvents = [];
    this.sfuEvents = [];
    this.log('Test state reset', 'info');
  },

  /**
   * Print test results
   */
  printResults() {
    
    
    
    
    
    
    this.p2pEvents.forEach((event, index) => {
      
    });
    
    
    if (this.sfuEvents.length > 0) {
      this.sfuEvents.forEach((event, index) => {
        
      });
    } else {
      
    }
    
    
    
    
    if (this.fallbackDetected) {
      
    } else if (this.p2pEvents.length > 0 && this.sfuEvents.length === 0) {
      
    } else {
      
    }
  },

  /**
   * Get connection state info
   */
  getConnectionInfo() {
    const socket = window.socket || window.getSocket?.();
    if (!socket) {
      return { error: 'Socket not found' };
    }

    return {
      socketConnected: socket.connected,
      socketId: socket.id,
      p2pEvents: this.p2pEvents.length,
      sfuEvents: this.sfuEvents.length,
      fallbackDetected: this.fallbackDetected,
      recentP2PEvents: this.p2pEvents.slice(-5),
      recentSFUEvents: this.sfuEvents.slice(-5),
    };
  },

  /**
   * Run all tests sequentially
   */
  async runAllTests() {
    
    
    this.log('Note: These tests require an active call session.', 'warning');
    this.log('Make sure you have initiated a call before running tests.', 'warning');
    
    // Test 1: Monitor fallback
    this.log('\n=== Test 1: Monitoring Fallback ===', 'test');
    this.monitorFallback();
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    this.log('\nRun testP2PFallback.printResults() to see results', 'info');
    this.log('Or wait for automatic results after 30 seconds', 'info');
  }
};

// Make it globally available
if (typeof window !== 'undefined') {
  window.testP2PFallback = testP2PFallback;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = testP2PFallback;
}

// Auto-start monitoring if in call context
if (typeof window !== 'undefined') {
  // Check if we're in a call after a delay
  setTimeout(() => {
    const socket = window.socket || window.getSocket?.();
    if (socket && socket.connected) {
      
      
      
      
      
      
    }
  }, 2000);
}


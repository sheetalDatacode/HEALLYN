# P2P to SFU Fallback Test Scripts

This directory contains test scripts to verify that the automatic SFU fallback mechanism works correctly when P2P connections fail.

## Test Scripts

### 1. Backend Test Script (`testP2PFallback.js`)

A comprehensive Node.js test script that simulates various P2P failure scenarios and verifies SFU fallback.

#### Usage

```bash
# Run all test scenarios
node scripts/testP2PFallback.js

# Test specific scenario
FAILURE_SCENARIO=init node scripts/testP2PFallback.js
FAILURE_SCENARIO=connection node scripts/testP2PFallback.js
FAILURE_SCENARIO=all node scripts/testP2PFallback.js
```

#### Environment Variables

- `TEST_DOCTOR_PHONE` - Phone number of existing doctor (default: first doctor in DB)
- `TEST_PATIENT_PHONE` - Phone number of existing patient (default: first patient in DB)
- `TEST_DOCTOR_ID` - Doctor MongoDB ID (alternative to phone)
- `TEST_PATIENT_ID` - Patient MongoDB ID (alternative to phone)
- `TEST_OTP` - OTP code to use (default: '123456')
- `FAILURE_SCENARIO` - Which failure to test: 'init', 'connection', 'ice', 'all' (default: 'all')

#### Examples

```bash
# Use default users and test all scenarios
node scripts/testP2PFallback.js

# Test with specific users
TEST_DOCTOR_PHONE=9876543201 TEST_PATIENT_PHONE=9876544001 node scripts/testP2PFallback.js

# Test only initialization failure
FAILURE_SCENARIO=init node scripts/testP2PFallback.js

# Test only connection failure
FAILURE_SCENARIO=connection node scripts/testP2PFallback.js
```

#### Test Scenarios

1. **P2P Initialization Failure**
   - Simulates P2P failing to initialize
   - Verifies that SFU fallback is triggered
   - Checks for mediasoup events

2. **P2P Connection Failure**
   - Simulates P2P connection failing after initialization
   - Verifies that SFU fallback is triggered
   - Monitors connection state changes

3. **P2P Success (No Fallback)**
   - Verifies that when P2P works, SFU is not used
   - Ensures no unnecessary fallback occurs

#### Expected Output

```
================================================================
P2P TO SFU FALLBACK TEST SUITE
================================================================

[Step 1] Connecting to database...
✅ Connected to MongoDB

[Step 2] Getting test users...
✅ Using doctor: Dr. John Doe (9876543201)
✅ Using patient: Jane Smith (9876544001)

[Step 3] Logging in users...
✅ Both users logged in successfully

[Step 4] Creating test appointment...
✅ Created test appointment: 507f1f77bcf86cd799439011

[Step 5] Connecting sockets...
✅ Doctor socket connected: abc123
✅ Patient socket connected: def456

🧪 === Test Scenario 1: P2P Initialization Failure ===
✅ Test: P2P Init Failure → SFU Fallback - SFU fallback triggered correctly

🧪 === Test Scenario 2: P2P Connection Failure ===
✅ Test: P2P Connection Failure → SFU Fallback - SFU fallback triggered correctly

🧪 === Test Scenario 3: P2P Success (No Fallback) ===
✅ Test: P2P Success → No Fallback - P2P connected successfully, no unnecessary fallback

================================================================
TEST SUMMARY
================================================================

Total Tests: 3
Passed: 3
Failed: 0

Test Details:
1. ✅ P2P Init Failure → SFU Fallback
   → SFU fallback triggered correctly
2. ✅ P2P Connection Failure → SFU Fallback
   → SFU fallback triggered correctly
3. ✅ P2P Success → No Fallback
   → P2P connected successfully, no unnecessary fallback

================================================================
🎉 All tests passed!
```

### 2. Browser Test Utility (`frontend/src/utils/testP2PFallback.js`)

A browser-based test utility that can be run in the browser console for manual testing.

#### Usage in Browser Console

1. Open browser console (F12)
2. Navigate to a page with an active call
3. Copy and paste the script from `frontend/src/utils/testP2PFallback.js`
4. Run test commands:

```javascript
// Start monitoring for fallback
testP2PFallback.monitorFallback()

// Print current results
testP2PFallback.printResults()

// Get connection info
testP2PFallback.getConnectionInfo()

// Reset test state
testP2PFallback.reset()

// Run all tests
testP2PFallback.runAllTests()
```

#### Available Commands

- `testP2PFallback.monitorFallback()` - Start monitoring socket events for fallback detection
- `testP2PFallback.printResults()` - Display test results and event log
- `testP2PFallback.getConnectionInfo()` - Get current connection state information
- `testP2PFallback.reset()` - Reset test state and logs
- `testP2PFallback.runAllTests()` - Run all test scenarios

#### Example Output

```
[2024-01-15T10:30:00.000Z] ℹ️ Starting fallback monitoring...
[2024-01-15T10:30:01.000Z] ✅ Socket event monitoring started
[2024-01-15T10:30:05.000Z] ℹ️ P2P Event (outgoing): p2p:offer
[2024-01-15T10:30:06.000Z] ℹ️ P2P Event (incoming): p2p:answer
[2024-01-15T10:30:10.000Z] ⚠️ SFU Event (outgoing): mediasoup:getRtpCapabilities
[2024-01-15T10:30:10.000Z] ✅ SFU Fallback Detected!

============================================================
P2P TO SFU FALLBACK TEST RESULTS
============================================================

Fallback Detected: ✅ YES

P2P Events (2):
  1. [10:30:05 AM] outgoing - p2p:offer
  2. [10:30:06 AM] incoming - p2p:answer

SFU Events (1):
  1. [10:30:10 AM] outgoing - mediasoup:getRtpCapabilities

Total Logs: 5
============================================================
✅ SUCCESS: SFU fallback mechanism is working!
```

## How Fallback Works

The automatic fallback mechanism works as follows:

1. **Initial Attempt**: System tries to establish P2P connection first
2. **Failure Detection**: Monitors for:
   - P2P initialization failure
   - P2P connection state = 'failed' or 'disconnected'
   - ICE connection failure
3. **Automatic Fallback**: When failure is detected:
   - Cleans up P2P resources
   - Removes P2P event handlers
   - Switches to SFU (mediasoup) mode
   - Initializes SFU connection
4. **One-Time Fallback**: Prevents infinite loops by only attempting fallback once

## Troubleshooting

### Test Script Fails to Connect

- Ensure MongoDB is running
- Check that backend server is running on port 5000
- Verify test users exist in database
- Check that OTP is correct (default: '123456')

### No Fallback Detected

- Check browser console for errors
- Verify that TURN servers are configured (for P2P)
- Ensure mediasoup is properly set up (for SFU)
- Check network connectivity

### False Positives

- P2P may succeed even with restrictive NATs if TURN is configured
- Some networks may allow P2P but with high latency
- Monitor both P2P and SFU events to understand the flow

## Integration with CI/CD

You can integrate the backend test script into your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Test P2P Fallback
  run: |
    node scripts/testP2PFallback.js
  env:
    MONGODB_URI: ${{ secrets.MONGODB_URI }}
    TEST_DOCTOR_PHONE: ${{ secrets.TEST_DOCTOR_PHONE }}
    TEST_PATIENT_PHONE: ${{ secrets.TEST_PATIENT_PHONE }}
```

## Notes

- Tests require actual user accounts in the database
- Tests create real call records (cleaned up after)
- Browser tests require an active call session
- Some tests may take 15-30 seconds to complete
- Network conditions affect test results

## Support

For issues or questions:
1. Check browser console for detailed logs
2. Review backend server logs
3. Verify environment variables are set correctly
4. Ensure all dependencies are installed


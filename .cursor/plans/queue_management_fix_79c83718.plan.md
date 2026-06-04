---
name: Queue Management Fix
overview: Fix queue management behavior for skip/complete/cancel operations to ensure proper token slot management with fixed tokens for completed/canceled appointments and correct reordering for skipped patients.
todos:
  - id: "1"
    content: Create queueReorderingService.js with reorderQueueAfterSkip function and helper utilities
    status: completed
  - id: "2"
    content: Refactor skipPatient endpoint to use transaction and call queueReorderingService
    status: completed
    dependencies:
      - "1"
  - id: "3"
    content: Update updateQueueStatus to explicitly ensure tokens remain fixed for completed/canceled
    status: completed
  - id: "4"
    content: Update frontend handleSkip, handleComplete, handleCancel to refresh from server response
    status: pending
    dependencies:
      - "2"
      - "3"
  - id: "5"
    content: Write unit tests for queue reordering algorithm (Case 1 and Case 2)
    status: completed
    dependencies:
      - "1"
  - id: "6"
    content: Write integration tests for skip/complete/cancel endpoints
    status: completed
    dependencies:
      - "2"
      - "3"
  - id: "7"
    content: Create README documenting algorithm and changes
    status: completed
    dependencies:
      - "1"
      - "2"
      - "3"
---

# Queue Management Fix Implementation Plan

## Problem Analysis

The current implementation has issues with queue management:

1. **Skip operation**: Complex logic that doesn't correctly move skipped patients to the last available active slot
2. **Complete/Cancel operations**: Don't ensure tokens remain fixed (patient keeps their slot)
3. **Queue reordering**: Doesn't properly fill gaps after skipping while preserving completed/canceled token positions

## Solution Overview

Implement a slot-based queue system where:

- Each appointment has a fixed `token` (1..N) representing its slot position
- `scheduledTime = sessionStart + (token-1) * avgTimePerPatient`
- Completed/canceled appointments keep their token fixed
- Skipped patients move to the last available active slot, and other active patients shift up to fill gaps

## Implementation Details

### 1. Backend: Fix Complete/Cancel Operations

**File**: `backend/controllers/doctor-controllers/doctorQueueController.js`

**Changes to `updateQueueStatus` (lines 1678-1916)**:

- When status is 'completed' or 'cancelled', ensure the appointment's `tokenNumber` remains unchanged
- Only update `status` and `queueStatus` fields
- Do NOT remove appointment from queue array (it should remain visible)
- Recalculate ETAs for remaining active patients

**New endpoint or modify existing**: Ensure cancel operation also keeps token fixed

- Check `cancelDoctorAppointment` in `doctorAppointmentController.js` to ensure it preserves tokenNumber

### 2. Backend: Rewrite Skip Operation

**File**: `backend/controllers/doctor-controllers/doctorQueueController.js`

**Replace `skipPatient` function (lines 172-1276)** with simplified logic:

1. **Find last available active slot**:

   - Get all appointments for the session
   - Filter out completed/canceled appointments (these tokens are protected)
   - Find the highest token number among active appointments
   - This is the target slot for the skipped patient

2. **Move skipped patient**:

   - Set skipped patient's tokenNumber to the last available active slot
   - Update queueStatus to 'skipped'
   - Recalculate scheduledTime based on new token

3. **Re-fill active slots**:

   - Get all active appointments (excluding the skipped one and completed/canceled)
   - Sort by current tokenNumber
   - Reassign tokens sequentially starting from 1, skipping over protected tokens (completed/canceled)
   - Recalculate scheduledTime for each based on new token

4. **Transaction safety**:

   - Wrap all updates in a MongoDB transaction
   - Ensure atomicity of all token reassignments

### 3. Backend: Add Helper Functions

**File**: `backend/services/queueService.js` (new file)

Create utility functions:

- `findLastAvailableActiveSlot(sessionId)`: Find highest token among active appointments
- `recalculateScheduledTimes(sessionId)`: Recalculate all scheduled times based on tokens
- `reorderActiveAppointments(sessionId, skippedAppointmentId)`: Reorder active appointments after skip

### 4. Backend: Update Queue Response

**File**: `backend/controllers/doctor-controllers/doctorQueueController.js`

**Update `getQueue` function (lines 10-79)**:

- Ensure appointments are sorted by tokenNumber
- Include completed/canceled appointments in response (they remain in queue)
- Calculate and include scheduledTime for each appointment

### 5. Frontend: Update UI to Reflect Changes

**File**: `frontend/src/modules/doctor/doctor-pages/DoctorPatients.jsx`

**Update handlers**:

- `handleComplete` (line 1532): Ensure it refreshes queue after completion
- `handleSkip` (line 1689): Ensure it refreshes queue after skip
- `handleNoShow` (line 1785): Ensure it refreshes queue after cancel

**Display updates**:

- Show completed/canceled appointments in queue with their fixed tokens
- Display scheduledTime for each appointment
- Update queue order immediately after operations

### 6. Testing

**Create test file**: `backend/tests/queue-management.test.js`

Test cases:

1. **Case 1**: Skip first patient in queue of 4 active patients
2. **Case 2**: Complete an appointment, then skip another - verify completed token remains fixed
3. **Case 2 extended**: Multiple skips with completed appointments in between
4. **Edge cases**: Skip last patient, skip when all slots filled, skip with multiple completed appointments

## Files to Modify

1. `backend/controllers/doctor-controllers/doctorQueueController.js` - Main queue logic
2. `backend/controllers/doctor-controllers/doctorAppointmentController.js` - Cancel operation
3. `backend/services/queueService.js` - New utility service
4. `frontend/src/modules/doctor/doctor-pages/DoctorPatients.jsx` - UI updates
5. `backend/tests/queue-management.test.js` - New test file

## Key Algorithm for Skip Operation

```
1. Get all appointments for session
2. Identify protected tokens (completed/canceled appointments)
3. Find last available active slot = max(token) where token NOT in protected tokens
4. Move skipped patient to last available active slot
5. Get all active appointments (excluding skipped, completed, canceled)
6. Sort active appointments by current tokenNumber
7. Reassign tokens sequentially (1, 2, 3, ...) skipping protected tokens
8. Recalculate scheduledTime for all appointments
9. Save all changes in transaction
```

## Database Transaction

All skip/complete/cancel operations must use MongoDB transactions to ensure:

- Atomicity: All token updates succeed or fail together
- Consistency: No duplicate tokens after operation
- Isolation: Concurrent operations don't interfere
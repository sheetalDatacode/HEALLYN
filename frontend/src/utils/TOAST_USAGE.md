# Toast Notification System - Usage Guide

## Overview

A reusable toast notification system has been implemented for the entire application. It provides beautiful, mobile-first toast notifications for success, error, info, and warning messages.

## Features

- ✅ Mobile-first design
- ✅ Auto-dismiss after configurable duration
- ✅ Manual close button
- ✅ Smooth animations (Framer Motion)
- ✅ Multiple toast types: success, error, info, warning
- ✅ Stack multiple toasts
- ✅ Accessible (ARIA labels)

## Usage

### Basic Usage

```javascript
import { useToast } from '@/contexts/ToastContext'

function MyComponent() {
  const toast = useToast()

  // Success message
  toast.success('Operation completed successfully!')

  // Error message
  toast.error('Something went wrong!')

  // Info message
  toast.info('Here is some information')

  // Warning message
  toast.warning('Please check your input')
}
```

### With Custom Duration

```javascript
// Show for 6 seconds instead of default 4 seconds
toast.success('Saved!', 6000)

// Show permanently (until manually closed)
toast.error('Critical error!', 0)
```

### In API Calls

```javascript
const handleSubmit = async () => {
  try {
    const data = await apiClient.post('/api/endpoint', formData)
    toast.success('Data saved successfully!')
  } catch (error) {
    toast.error(error.message || 'Failed to save data')
  }
}
```

### In Form Validation

```javascript
const handleSubmit = (e) => {
  e.preventDefault()
  
  if (!email) {
    toast.error('Email is required')
    return
  }
  
  if (!isValidEmail(email)) {
    toast.warning('Please enter a valid email address')
    return
  }
  
  // Proceed with submission
  toast.success('Form submitted successfully!')
}
```

## Toast Types

| Type | Color | Icon | Use Case |
|------|-------|------|----------|
| `success` | Green | ✓ | Successful operations |
| `error` | Red | ✗ | Errors, failures |
| `info` | Blue | ℹ | Informational messages |
| `warning` | Amber | ⚠ | Warnings, cautions |

## Examples

### Login Success
```javascript
toast.success('Login successful! Redirecting...')
```

### API Error
```javascript
catch (error) {
  toast.error(error.message || 'An error occurred')
}
```

### Form Validation
```javascript
if (password.length < 8) {
  toast.warning('Password must be at least 8 characters')
  return
}
```

### Info Message
```javascript
toast.info('Your session will expire in 5 minutes')
```

## Implementation Status

### ✅ Implemented
- Toast Context & Provider
- Admin Login page
- Admin Signup page

### 🔄 To Be Added
- All other pages as needed
- Replace `window.alert()` calls
- Replace inline error messages

## Best Practices

1. **Use appropriate toast types**
   - Success for completed actions
   - Error for failures
   - Warning for validation issues
   - Info for general information

2. **Keep messages concise**
   - Short and clear messages work best
   - Avoid long sentences

3. **Don't overuse**
   - Don't show toasts for every minor action
   - Use for important feedback only

4. **Replace alerts**
   - Replace `window.alert()` with toast
   - Better UX and mobile-friendly

## Mobile-First Design

Toasts are positioned:
- **Mobile**: Top center, full width (with padding)
- **Desktop**: Top right, max-width 28rem

This ensures great UX on all devices!


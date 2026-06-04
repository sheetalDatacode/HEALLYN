<!-- efa81460-7cf8-4c2c-b71b-f48c6af8de44 4ea62cfd-90ba-4a53-b489-bead86ec6eec -->
# Doctor, Pharmacy, and Laboratory Unified Login/Signup Page

## Overview

Create a single login/signup page (`DoctorLogin.jsx`) that allows users to choose between three modules (Doctor, Pharmacy, Laboratory) and provides separate login/signup forms for each based on their backend model requirements.

**Important Implementation Strategy:**

- **DO NOT** build the entire page at once. Start with basic structure first, then enhance incrementally.
- **Phase 1-2**: Create minimal working UI with module selection and basic login form only
- **Phase 3-5**: Add signup forms one module at a time (Doctor → Pharmacy → Laboratory)
- **Phase 6-8**: Enhance with API integration, validation, and UX improvements
- This incremental approach keeps file size manageable and allows tasks to be completed in manageable parts.

## Phase 1: UI Structure and Module Selection

**File:** `frontend/src/modules/doctor/doctor-pages/DoctorLogin.jsx`

- Create base component structure similar to `PatientLogin.jsx`
- Add module selection toggle (Doctor/Pharmacy/Laboratory) - three button group above Login/Signup toggle
- Add Login/Signup mode toggle (same as PatientLogin)
- Implement state management:
- `selectedModule`: 'doctor' | 'pharmacy' | 'laboratory'
- `mode`: 'login' | 'signup'
- Separate login data state for each module (email, password, remember)
- Separate signup data states for each module

## Phase 2: Login Forms Implementation

**File:** `frontend/src/modules/doctor/doctor-pages/DoctorLogin.jsx`

- Create unified login form that switches based on `selectedModule`
- Common fields: email, password, remember me, forgot password link
- API endpoints:
- Doctor: `POST /api/doctors/auth/login`
- Pharmacy: `POST /api/pharmacy/auth/login`
- Laboratory: `POST /api/laboratory/auth/login`
- Handle login submission with proper error handling
- Redirect to appropriate dashboard after successful login

## Phase 3: Doctor Signup Form

**File:** `frontend/src/modules/doctor/doctor-pages/DoctorLogin.jsx`

**Required Fields:**

- firstName, lastName, email, phone, password, confirmPassword
- specialization, gender, licenseNumber
- experienceYears (optional)

**Optional Fields (sections):**

- Education: array of {institution, degree, year}
- Languages: array of strings (multi-select)
- Consultation Modes: checkboxes for ['in_person', 'video', 'audio', 'chat']
- Clinic Details:
- clinicName, clinicAddress (line1, line2, city, state, postalCode, country)
- bio, qualification, consultationFee
- Terms acceptance checkbox

## Phase 4: Pharmacy Signup Form

**File:** `frontend/src/modules/doctor/doctor-pages/DoctorLogin.jsx`

**Required Fields:**

- pharmacyName, email, phone, password, confirmPassword, licenseNumber

**Optional Fields (sections):**

- ownerName, gstNumber
- Address (same structure as Doctor)
- Delivery Options: checkboxes for ['pickup', 'delivery', 'both']
- serviceRadiusKm (number input)
- timings (array of strings - can use textarea or multi-input)
- Contact Person: name, phone, email
- Terms acceptance checkbox

## Phase 5: Laboratory Signup Form

**File:** `frontend/src/modules/doctor/doctor-pages/DoctorLogin.jsx`

**Required Fields:**

- labName, email, phone, password, confirmPassword, licenseNumber

**Optional Fields (sections):**

- ownerName
- certifications: array of strings (multi-input)
- Address (same structure as Doctor/Pharmacy)
- servicesOffered: array of strings (multi-input or tags)
- timings: array of strings
- Contact Person: name, phone, email
- Operating Hours: opening, closing, days (array)
- Terms acceptance checkbox

## Phase 6: API Integration and State Management

**File:** `frontend/src/modules/doctor/doctor-pages/DoctorLogin.jsx`

- Create API service functions or inline fetch calls:
- `handleDoctorLogin()`, `handlePharmacyLogin()`, `handleLaboratoryLogin()`
- `handleDoctorSignup()`, `handlePharmacySignup()`, `handleLaboratorySignup()`
- Handle form validation (required fields, password match, email format)
- Handle API responses and errors
- Store authentication tokens in localStorage/sessionStorage
- Show loading states during submission
- Display success/error messages

## Phase 7: Routing and Navigation

**Files:**

- `frontend/src/App.jsx`
- `frontend/src/modules/doctor/doctor-components/DoctorNavbar.jsx` (if exists)

- Add route in `App.jsx`: `/doctor/login` → `<DoctorLogin />`
- Exclude navbar on login page (similar to patient login)
- Handle redirects after login:
- Doctor → `/doctor/dashboard`
- Pharmacy → `/pharmacy/dashboard` (if route exists, otherwise `/doctor/dashboard`)
- Laboratory → `/laboratory/dashboard` (if route exists, otherwise `/doctor/dashboard`)
- Update `DoctorNavbar.jsx` to hide on login page if applicable

## Phase 8: Form Validation and UX Enhancements

**File:** `frontend/src/modules/doctor/doctor-pages/DoctorLogin.jsx`

- Password visibility toggles
- Real-time validation feedback
- Form field icons (using react-icons/io5)
- Responsive design (mobile-first)
- Smooth transitions between module/mode changes
- Clear section dividers for multi-section signup forms
- Helper text for complex fields (e.g., consultation modes, delivery options)

## Technical Details

**API Base URLs:**

- Doctor: `/api/doctors/auth/`
- Pharmacy: `/api/pharmacy/auth/`
- Laboratory: `/api/laboratory/auth/`

**Required Form Handling:**

- Nested object handling (address, clinicDetails, contactPerson, etc.)
- Array field management (education, languages, certifications, etc.)
- File upload placeholders for documents (can be implemented later)

**Styling:**

- Match `PatientLogin.jsx` design and theme (#11496c)
- Use same input styles, button styles, and spacing
- Mobile-first responsive design

## Testing Considerations

- Test module switching preserves form data where appropriate
- Test login flow for all three modules
- Test signup validation for each module
- Test form reset on module/mode change
- Test API error handling

### To-dos

- [ ] Create base UI structure with module selection (Doctor/Pharmacy/Laboratory) toggle and Login/Signup toggle
- [ ] Implement unified login form that switches based on selected module with API integration
- [ ] Create comprehensive Doctor signup form with all required and optional fields from backend model
- [ ] Create comprehensive Pharmacy signup form with all required and optional fields from backend model
- [ ] Create comprehensive Laboratory signup form with all required and optional fields from backend model
- [ ] Integrate API calls for login and signup for all three modules with error handling
- [ ] Add route in App.jsx and handle navbar exclusion and redirects after login
- [ ] Add form validation, password toggles, and UX enhancements
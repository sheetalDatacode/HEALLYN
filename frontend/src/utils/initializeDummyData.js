// Initialize comprehensive dummy data in localStorage for all modules
// This should be called on app initialization

import {
  mockPatients,
  mockDoctors,
  mockPrescriptions,
  mockLabReports,
  mockAppointments,
  mockPharmacies,
  mockPharmacyOrders,
  mockPharmacyMedicines,
  mockLabs,
  mockLabTests,
  mockLabOrders,
  mockDoctorConsultations,
  mockAdminUsers,
  mockAdminVerifications,
} from './dummyData'

export const initializeDummyData = () => {
  try {
    // Initialize Patient Module Data
    if (!localStorage.getItem('patientLabReports_pat-current')) {
      localStorage.setItem('patientLabReports_pat-current', JSON.stringify(mockLabReports))
    }
    
    if (!localStorage.getItem('sharedLabReports_pat-current')) {
      localStorage.setItem('sharedLabReports_pat-current', JSON.stringify(mockLabReports))
    }
    
    // Initialize Pharmacy Module Data
    if (!localStorage.getItem('pharmacyMedicines')) {
      localStorage.setItem('pharmacyMedicines', JSON.stringify(mockPharmacyMedicines))
    }
    
    // Initialize Laboratory Module Data
    if (!localStorage.getItem('laboratoryConfirmedOrders')) {
      localStorage.setItem('laboratoryConfirmedOrders', JSON.stringify(mockLabOrders))
    }
    
    if (!localStorage.getItem('laboratoryAvailableTests')) {
      localStorage.setItem('laboratoryAvailableTests', JSON.stringify(mockLabTests))
    }
    
    // Initialize Admin Module Data
    if (!localStorage.getItem('adminUsers')) {
      localStorage.setItem('adminUsers', JSON.stringify(mockAdminUsers))
    }
    
    if (!localStorage.getItem('adminVerifications')) {
      localStorage.setItem('adminVerifications', JSON.stringify(mockAdminVerifications))
    }
    
    // Initialize Pharmacy Orders (for pharmacy request orders page)
    if (!localStorage.getItem('pharmacyRequestOrders')) {
      localStorage.setItem('pharmacyRequestOrders', JSON.stringify(mockPharmacyOrders))
    }
    
    // Initialize Admin Requests
    if (!localStorage.getItem('adminRequests')) {
      const adminRequests = [
        {
          id: 'req-1',
          type: 'order_medicine',
          patientName: 'John Doe',
          patientId: 'pat-1',
          pharmacyId: 'pharm-1',
          status: 'pending',
          createdAt: new Date().toISOString(),
          totalAmount: 1250,
        },
        {
          id: 'req-2',
          type: 'order_medicine',
          patientName: 'Sarah Smith',
          patientId: 'pat-2',
          pharmacyId: 'pharm-1',
          status: 'pending',
          createdAt: new Date().toISOString(),
          totalAmount: 850,
        },
      ]
      localStorage.setItem('adminRequests', JSON.stringify(adminRequests))
    }
    
    // Initialize Patient Appointments
    if (!localStorage.getItem('patientAppointments')) {
      localStorage.setItem('patientAppointments', JSON.stringify(mockAppointments))
    }
    
    // Initialize Doctor Appointments
    if (!localStorage.getItem('doctorAppointments')) {
      localStorage.setItem('doctorAppointments', JSON.stringify(mockAppointments))
    }
    
    // Initialize Pharmacy Info
    if (!localStorage.getItem('pharmacy_pharm-1')) {
      const pharmacyInfo = {
        pharmacyName: 'Rx Care Pharmacy',
        ownerName: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-214-0098',
        licenseNumber: 'RX-45287',
        address: {
          line1: '123 Market Street',
          line2: 'Suite 210',
          city: 'Springfield',
          state: 'IL',
          postalCode: '62701',
          country: 'USA',
        },
        contactPerson: {
          name: 'Lauren Patel',
          phone: '+1-555-211-0800',
          email: 'lauren.patel@rxcare.com',
        },
      }
      localStorage.setItem('pharmacy_pharm-1', JSON.stringify(pharmacyInfo))
    }
    
    
  } catch (error) {
    console.error('❌ Error initializing dummy data:', error)
  }
}

// Call this function on app load
if (typeof window !== 'undefined') {
  // Initialize dummy data when the module is imported
  initializeDummyData()
}


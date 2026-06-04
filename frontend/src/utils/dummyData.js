// Comprehensive Dummy Data for Healiin Application
// This file contains all mock data used across different modules

// ============================================
// PATIENT MODULE DATA
// ============================================

export const mockPatients = [
  {
    id: 'pat-1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+91 98765 12345',
    age: 32,
    gender: 'Male',
    address: '123 Main Street, Pune, Maharashtra 411001',
    image: 'https://ui-avatars.com/api/?name=John+Doe&background=3b82f6&color=fff&size=128&bold=true',
    bloodGroup: 'O+',
    emergencyContact: {
      name: 'Jane Doe',
      phone: '+91 98765 12346',
      relation: 'Wife',
    },
  },
  {
    id: 'pat-2',
    name: 'Sarah Smith',
    email: 'sarah.smith@example.com',
    phone: '+91 98765 23456',
    age: 28,
    gender: 'Female',
    address: '456 Oak Avenue, Mumbai, Maharashtra 400001',
    image: 'https://ui-avatars.com/api/?name=Sarah+Smith&background=ec4899&color=fff&size=128&bold=true',
    bloodGroup: 'A+',
    emergencyContact: {
      name: 'Mike Smith',
      phone: '+91 98765 23457',
      relation: 'Husband',
    },
  },
  {
    id: 'pat-3',
    name: 'Mike Johnson',
    email: 'mike.johnson@example.com',
    phone: '+91 98765 34567',
    age: 45,
    gender: 'Male',
    address: '789 Pine Road, Delhi, Delhi 110001',
    image: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=10b981&color=fff&size=128&bold=true',
    bloodGroup: 'B+',
    emergencyContact: {
      name: 'Lisa Johnson',
      phone: '+91 98765 34568',
      relation: 'Wife',
    },
  },
  {
    id: 'pat-4',
    name: 'Emily Brown',
    email: 'emily.brown@example.com',
    phone: '+91 98765 45678',
    age: 35,
    gender: 'Female',
    address: '321 Elm Street, Bangalore, Karnataka 560001',
    image: 'https://ui-avatars.com/api/?name=Emily+Brown&background=8b5cf6&color=fff&size=128&bold=true',
    bloodGroup: 'AB+',
    emergencyContact: {
      name: 'Robert Brown',
      phone: '+91 98765 45679',
      relation: 'Husband',
    },
  },
  {
    id: 'pat-5',
    name: 'David Wilson',
    email: 'david.wilson@example.com',
    phone: '+91 98765 56789',
    age: 50,
    gender: 'Male',
    address: '654 Maple Drive, Chennai, Tamil Nadu 600001',
    image: 'https://ui-avatars.com/api/?name=David+Wilson&background=f59e0b&color=fff&size=128&bold=true',
    bloodGroup: 'O-',
    emergencyContact: {
      name: 'Mary Wilson',
      phone: '+91 98765 56790',
      relation: 'Wife',
    },
  },
]

export const mockDoctors = [
  {
    id: 'doc-1',
    name: 'Dr. Sarah Mitchell',
    specialty: 'Cardiology',
    distance: '1.2 km',
    location: 'Heart Care Center, New York',
    rating: 4.8,
    consultationFee: 800,
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
    experience: '12 years',
    education: 'MBBS, MD Cardiology',
    languages: ['English', 'Hindi'],
    availability: 'Mon-Fri, 9 AM - 6 PM',
    totalConsultations: 342,
    totalPatients: 156,
  },
  {
    id: 'doc-2',
    name: 'Dr. Alana Rueter',
    specialty: 'Dentist',
    distance: '0.9 km',
    location: 'Sunrise Dental Care, New York',
    rating: 4.7,
    consultationFee: 500,
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
    experience: '8 years',
    education: 'BDS, MDS',
    languages: ['English', 'Spanish'],
    availability: 'Mon-Sat, 10 AM - 7 PM',
    totalConsultations: 245,
    totalPatients: 98,
  },
  {
    id: 'doc-3',
    name: 'Dr. James Wilson',
    specialty: 'Orthopedic',
    distance: '3.1 km',
    location: 'Bone & Joint Clinic, New York',
    rating: 4.9,
    consultationFee: 750,
    image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=400&q=80',
    experience: '15 years',
    education: 'MBBS, MS Orthopedics',
    languages: ['English'],
    availability: 'Mon-Fri, 8 AM - 5 PM',
    totalConsultations: 456,
    totalPatients: 203,
  },
  {
    id: 'doc-4',
    name: 'Dr. Michael Brown',
    specialty: 'General Medicine',
    distance: '0.9 km',
    location: 'Family Health Clinic, New York',
    rating: 4.9,
    consultationFee: 600,
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031a?auto=format&fit=crop&w=400&q=80',
    experience: '10 years',
    education: 'MBBS, MD General Medicine',
    languages: ['English', 'Hindi', 'Marathi'],
    availability: 'Mon-Sat, 9 AM - 6 PM',
    totalConsultations: 512,
    totalPatients: 234,
  },
  {
    id: 'doc-5',
    name: 'Dr. Emily Chen',
    specialty: 'Neurology',
    distance: '1.8 km',
    location: 'Neuro Care Institute, New York',
    rating: 4.6,
    consultationFee: 900,
    image: 'https://images.unsplash.com/photo-1594824476968-48fd8d2d7dc2?auto=format&fit=crop&w=400&q=80',
    experience: '14 years',
    education: 'MBBS, MD Neurology',
    languages: ['English', 'Mandarin'],
    availability: 'Mon-Fri, 10 AM - 6 PM',
    totalConsultations: 298,
    totalPatients: 145,
  },
  {
    id: 'doc-6',
    name: 'Dr. Priya Sharma',
    specialty: 'Pediatrician',
    distance: '2.5 km',
    location: 'Kids Care Hospital, New York',
    rating: 4.8,
    consultationFee: 650,
    image: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=400&q=80',
    experience: '11 years',
    education: 'MBBS, MD Pediatrics',
    languages: ['English', 'Hindi'],
    availability: 'Mon-Sat, 9 AM - 7 PM',
    totalConsultations: 387,
    totalPatients: 178,
  },
]

export const mockPrescriptions = [
  {
    id: 'presc-1',
    doctor: {
      name: 'Dr. Sarah Mitchell',
      specialty: 'Cardiology',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
    },
    issuedAt: '2025-01-10',
    status: 'active',
    diagnosis: 'Hypertension',
    symptoms: 'High blood pressure\nHeadaches\nChest discomfort',
    medications: [
      { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: '30 days', instructions: 'Take with food. Monitor blood pressure regularly.' },
      { name: 'Losartan', dosage: '50mg', frequency: 'Once daily', duration: '30 days', instructions: 'Take in the morning. Avoid potassium supplements.' },
    ],
    investigations: [
      { name: 'ECG', notes: 'Routine checkup' },
      { name: 'Blood Pressure Monitoring', notes: 'Daily' },
    ],
    advice: 'Maintain a low-sodium diet and regular exercise. Monitor blood pressure daily.',
    followUpAt: '2025-02-10',
    pdfUrl: '#',
    sharedWith: {
      pharmacies: ['Rx Care Pharmacy'],
      laboratories: ['MediCare Diagnostics'],
    },
  },
  {
    id: 'presc-2',
    doctor: {
      name: 'Dr. Alana Rueter',
      specialty: 'Dentist',
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
    },
    issuedAt: '2025-01-08',
    status: 'active',
    diagnosis: 'Dental Caries',
    symptoms: 'Tooth pain\nSensitivity to hot and cold',
    medications: [
      { name: 'Amoxicillin', dosage: '500mg', frequency: 'Three times daily', duration: '7 days', instructions: 'Complete the full course. Take with meals to avoid stomach upset.' },
      { name: 'Ibuprofen', dosage: '400mg', frequency: 'As needed for pain', duration: '5 days', instructions: 'Take with food. Do not exceed recommended dosage.' },
    ],
    investigations: [],
    advice: 'Maintain good oral hygiene. Avoid hard foods for the next few days.',
    followUpAt: '2025-01-22',
    pdfUrl: '#',
    sharedWith: {
      pharmacies: ['HealthHub Pharmacy'],
      laboratories: [],
    },
  },
  {
    id: 'presc-3',
    doctor: {
      name: 'Dr. Michael Brown',
      specialty: 'General Medicine',
      image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031a?auto=format&fit=crop&w=400&q=80',
    },
    issuedAt: '2025-01-05',
    status: 'completed',
    diagnosis: 'Common Cold',
    medications: [
      { name: 'Paracetamol', dosage: '500mg', frequency: 'As needed', duration: '5 days' },
    ],
    investigations: [],
    advice: 'Rest and stay hydrated. If symptoms persist, consult again.',
    followUpAt: null,
    pdfUrl: '#',
    sharedWith: {
      pharmacies: ['Neighborhood Family Pharmacy'],
      laboratories: [],
    },
  },
]

export const mockLabReports = [
  {
    id: 'report-1',
    testName: 'Complete Blood Count (CBC)',
    labName: 'MediCare Diagnostics',
    labId: 'lab-1',
    date: '2025-01-10',
    status: 'ready',
    downloadUrl: '#',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sarah Mitchell',
    doctorSpecialty: 'Cardiology',
    doctorImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
    pdfFileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    pdfFileName: 'CBC_Report_2025-01-10.pdf',
    orderId: 'ORD-2025-001',
  },
  {
    id: 'report-2',
    testName: 'Lipid Profile',
    labName: 'HealthFirst Lab',
    labId: 'lab-2',
    date: '2025-01-08',
    status: 'ready',
    downloadUrl: '#',
    doctorId: 'doc-2',
    doctorName: 'Dr. John Smith',
    doctorSpecialty: 'General Medicine',
    doctorImage: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
    pdfFileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    pdfFileName: 'Lipid_Profile_2025-01-08.pdf',
    orderId: 'ORD-2025-002',
  },
  {
    id: 'report-3',
    testName: 'Liver Function Test (LFT)',
    labName: 'Precision Labs',
    labId: 'lab-3',
    date: '2025-01-05',
    status: 'ready',
    downloadUrl: '#',
    doctorId: 'doc-4',
    doctorName: 'Dr. Michael Brown',
    doctorSpecialty: 'General Medicine',
    doctorImage: 'https://images.unsplash.com/photo-1622253692010-333f2da6031a?auto=format&fit=crop&w=400&q=80',
    pdfFileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    pdfFileName: 'LFT_Report_2025-01-05.pdf',
    orderId: 'ORD-2025-003',
  },
]

export const mockAppointments = [
  {
    id: 'apt-1',
    doctorName: 'Dr. Sarah Mitchell',
    doctorImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
    specialty: 'Cardiology',
    clinic: 'Heart Care Center',
    date: '2025-01-15',
    time: '10:00 AM',
    status: 'confirmed',
    type: 'In-person',
    duration: '30 min',
    reason: 'Follow-up consultation',
  },
  {
    id: 'apt-2',
    doctorName: 'Dr. Priya Sharma',
    doctorImage: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=400&q=80',
    specialty: 'Pediatrician',
    clinic: 'Kids Care Hospital',
    date: '2025-01-16',
    time: '02:30 PM',
    status: 'confirmed',
    type: 'Video',
    duration: '45 min',
    reason: 'Initial consultation',
  },
  {
    id: 'apt-3',
    doctorName: 'Dr. Michael Brown',
    doctorImage: 'https://images.unsplash.com/photo-1622253692010-333f2da6031a?auto=format&fit=crop&w=400&q=80',
    specialty: 'General Medicine',
    clinic: 'Family Health Clinic',
    date: '2025-01-17',
    time: '11:00 AM',
    status: 'pending',
    type: 'In-person',
    duration: '20 min',
    reason: 'Quick check-up',
  },
]

// ============================================
// PHARMACY MODULE DATA
// ============================================

export const mockPharmacies = [
  {
    id: 'pharm-1',
    name: 'Rx Care Pharmacy',
    distance: '0.9 km',
    location: '123 Market Street, New York',
    rating: 4.8,
    phone: '+1-555-214-0098',
    email: 'info@rxcare.com',
    ownerName: 'John Doe',
    licenseNumber: 'RX-45287',
    address: {
      line1: '123 Market Street',
      line2: 'Suite 210',
      city: 'Springfield',
      state: 'IL',
      postalCode: '62701',
      country: 'USA',
    },
  },
  {
    id: 'pharm-2',
    name: 'HealthHub Pharmacy',
    distance: '1.5 km',
    location: '77 Elm Avenue, New York',
    rating: 4.6,
    phone: '+1-555-909-4433',
    email: 'info@healthhub.com',
    ownerName: 'Sarah Smith',
    licenseNumber: 'RX-45288',
    address: {
      line1: '77 Elm Avenue',
      city: 'Springfield',
      state: 'IL',
      postalCode: '62702',
      country: 'USA',
    },
  },
  {
    id: 'pharm-3',
    name: 'Neighborhood Family Pharmacy',
    distance: '2.6 km',
    location: '452 Cedar Lane, New York',
    rating: 4.2,
    phone: '+1-555-712-0080',
    email: 'info@neighborhoodpharm.com',
    ownerName: 'Mike Johnson',
    licenseNumber: 'RX-45289',
    address: {
      line1: '452 Cedar Lane',
      city: 'Springfield',
      state: 'IL',
      postalCode: '62703',
      country: 'USA',
    },
  },
]

export const mockPharmacyOrders = [
  {
    id: 'order-1',
    patientName: 'John Doe',
    patientImage: 'https://ui-avatars.com/api/?name=John+Doe&background=3b82f6&color=fff&size=128&bold=true',
    time: '09:00 AM',
    status: 'pending',
    totalAmount: 42.5,
    deliveryType: 'home',
    prescriptionId: 'prx-3021',
    paymentConfirmed: false,
    deliveryStatus: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'order-2',
    patientName: 'Sarah Smith',
    patientImage: 'https://ui-avatars.com/api/?name=Sarah+Smith&background=ec4899&color=fff&size=128&bold=true',
    time: '10:30 AM',
    status: 'ready',
    totalAmount: 34.0,
    deliveryType: 'pickup',
    prescriptionId: 'prx-3022',
    paymentConfirmed: true,
    deliveryStatus: 'preparing',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'order-3',
    patientName: 'Mike Johnson',
    patientImage: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=10b981&color=fff&size=128&bold=true',
    time: '02:00 PM',
    status: 'pending',
    totalAmount: 196.0,
    deliveryType: 'home',
    prescriptionId: 'prx-3023',
    paymentConfirmed: false,
    deliveryStatus: null,
    createdAt: new Date().toISOString(),
  },
]

export const mockPharmacyMedicines = [
  {
    id: 'med-1',
    name: 'Paracetamol 500mg',
    category: 'Pain Relief',
    manufacturer: 'ABC Pharmaceuticals',
    price: 25.0,
    stock: 150,
    expiryDate: '2026-12-31',
    batchNumber: 'BATCH-001',
    description: 'Pain reliever and fever reducer',
  },
  {
    id: 'med-2',
    name: 'Amoxicillin 500mg',
    category: 'Antibiotic',
    manufacturer: 'XYZ Pharma',
    price: 45.0,
    stock: 80,
    expiryDate: '2026-06-30',
    batchNumber: 'BATCH-002',
    description: 'Broad-spectrum antibiotic',
  },
  {
    id: 'med-3',
    name: 'Ibuprofen 400mg',
    category: 'Pain Relief',
    manufacturer: 'DEF Medical',
    price: 35.0,
    stock: 120,
    expiryDate: '2027-03-31',
    batchNumber: 'BATCH-003',
    description: 'Anti-inflammatory pain reliever',
  },
]

// ============================================
// LABORATORY MODULE DATA
// ============================================

export const mockLabs = [
  {
    id: 'lab-1',
    name: 'MediCare Diagnostics',
    distance: '1.2 km',
    location: '123 Health Street, New York',
    rating: 4.8,
    phone: '+1-555-123-4567',
    email: 'info@medicarelab.com',
    ownerName: 'Dr. Robert Lee',
    licenseNumber: 'LAB-12345',
    address: {
      line1: '123 Health Street',
      city: 'Springfield',
      state: 'IL',
      postalCode: '62701',
      country: 'USA',
    },
  },
  {
    id: 'lab-2',
    name: 'HealthFirst Lab',
    distance: '2.5 km',
    location: '456 Medical Avenue, New York',
    rating: 4.6,
    phone: '+1-555-234-5678',
    email: 'info@healthfirst.com',
    ownerName: 'Dr. Emily Chen',
    licenseNumber: 'LAB-12346',
    address: {
      line1: '456 Medical Avenue',
      city: 'Springfield',
      state: 'IL',
      postalCode: '62702',
      country: 'USA',
    },
  },
  {
    id: 'lab-3',
    name: 'Precision Labs',
    distance: '0.8 km',
    location: '789 Wellness Boulevard, New York',
    rating: 4.9,
    phone: '+1-555-345-6789',
    email: 'info@precisionlabs.com',
    ownerName: 'Dr. James Wilson',
    licenseNumber: 'LAB-12347',
    address: {
      line1: '789 Wellness Boulevard',
      city: 'Springfield',
      state: 'IL',
      postalCode: '62703',
      country: 'USA',
    },
  },
]

export const mockLabTests = [
  {
    id: 'test-1',
    name: 'Complete Blood Count (CBC)',
    category: 'Hematology',
    price: 350,
    duration: '24 hours',
    description: 'Complete blood count including RBC, WBC, platelets, and hemoglobin',
    preparation: 'Fasting not required',
  },
  {
    id: 'test-2',
    name: 'Lipid Profile',
    category: 'Cardiology',
    price: 600,
    duration: '24 hours',
    description: 'Total cholesterol, HDL, LDL, and triglycerides',
    preparation: '12 hours fasting required',
  },
  {
    id: 'test-3',
    name: 'Liver Function Test (LFT)',
    category: 'Hepatology',
    price: 800,
    duration: '24 hours',
    description: 'ALT, AST, ALP, bilirubin, and protein levels',
    preparation: 'Fasting not required',
  },
  {
    id: 'test-4',
    name: 'Kidney Function Test (KFT)',
    category: 'Nephrology',
    price: 750,
    duration: '24 hours',
    description: 'Creatinine, urea, and electrolyte levels',
    preparation: 'Fasting not required',
  },
  {
    id: 'test-5',
    name: 'Thyroid Function Test',
    category: 'Endocrinology',
    price: 900,
    duration: '48 hours',
    description: 'TSH, T3, and T4 levels',
    preparation: 'Fasting not required',
  },
]

export const mockLabOrders = [
  {
    id: 'order-1',
    orderId: 'ORD-2025-001',
    patientId: 'pat-1',
    patientName: 'John Doe',
    patientImage: 'https://ui-avatars.com/api/?name=John+Doe&background=3b82f6&color=fff&size=160&bold=true',
    patientPhone: '+1-555-123-4567',
    patientEmail: 'john.doe@example.com',
    status: 'ready',
    testName: 'Complete Blood Count (CBC)',
    orderDate: '2025-01-15T10:30:00.000Z',
    hasReport: false,
  },
  {
    id: 'order-2',
    orderId: 'ORD-2025-002',
    patientId: 'pat-2',
    patientName: 'Sarah Smith',
    patientImage: 'https://ui-avatars.com/api/?name=Sarah+Smith&background=ec4899&color=fff&size=160&bold=true',
    patientPhone: '+1-555-234-5678',
    patientEmail: 'sarah.smith@example.com',
    status: 'completed',
    testName: 'Lipid Profile',
    orderDate: '2025-01-14T14:15:00.000Z',
    hasReport: true,
    reportShared: true,
  },
  {
    id: 'order-3',
    orderId: 'ORD-2025-003',
    patientId: 'pat-3',
    patientName: 'Mike Johnson',
    patientImage: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=10b981&color=fff&size=160&bold=true',
    patientPhone: '+1-555-345-6789',
    patientEmail: 'mike.johnson@example.com',
    status: 'ready',
    testName: 'Liver Function Test (LFT)',
    orderDate: '2025-01-13T16:45:00.000Z',
    hasReport: false,
  },
]

// ============================================
// DOCTOR MODULE DATA
// ============================================

export const mockDoctorConsultations = [
  {
    id: 'cons-1',
    patientName: 'David Wilson',
    patientImage: 'https://ui-avatars.com/api/?name=David+Wilson&background=6366f1&color=fff&size=128&bold=true',
    date: '2025-01-15',
    time: '10:00 AM',
    type: 'In-person',
    status: 'completed',
    diagnosis: 'Hypertension',
    prescriptionId: 'presc-1',
  },
  {
    id: 'cons-2',
    patientName: 'Lisa Anderson',
    patientImage: 'https://ui-avatars.com/api/?name=Lisa+Anderson&background=8b5cf6&color=fff&size=128&bold=true',
    date: '2025-01-14',
    time: '02:30 PM',
    type: 'Video',
    status: 'completed',
    diagnosis: 'Common Cold',
    prescriptionId: 'presc-2',
  },
  {
    id: 'cons-3',
    patientName: 'Robert Taylor',
    patientImage: 'https://ui-avatars.com/api/?name=Robert+Taylor&background=ef4444&color=fff&size=128&bold=true',
    date: '2025-01-13',
    time: '11:00 AM',
    type: 'In-person',
    status: 'completed',
    diagnosis: 'Diabetes Type 2',
    prescriptionId: 'presc-3',
  },
]

// ============================================
// ADMIN MODULE DATA
// ============================================

export const mockAdminUsers = [
  {
    id: 'user-1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+91 98765 12345',
    role: 'patient',
    status: 'active',
    registeredAt: '2024-01-15',
    lastActive: '2025-01-15',
  },
  {
    id: 'user-2',
    name: 'Dr. Sarah Mitchell',
    email: 'sarah.mitchell@example.com',
    phone: '+91 98765 23456',
    role: 'doctor',
    status: 'active',
    registeredAt: '2024-02-20',
    lastActive: '2025-01-15',
  },
  {
    id: 'user-3',
    name: 'Rx Care Pharmacy',
    email: 'info@rxcare.com',
    phone: '+91 98765 34567',
    role: 'pharmacy',
    status: 'active',
    registeredAt: '2024-03-10',
    lastActive: '2025-01-15',
  },
]

export const mockAdminVerifications = [
  {
    id: 'ver-1',
    type: 'doctor',
    name: 'Dr. Amit Patel',
    image: 'https://ui-avatars.com/api/?name=Dr+Amit+Patel&background=10b981&color=fff&size=128&bold=true',
    specialty: 'Cardiologist',
    submittedAt: '2025-01-15',
    time: '09:00 AM',
    status: 'pending',
    email: 'amit.patel@example.com',
    documents: {
      license: 'license.pdf',
      degree: 'degree.pdf',
      idProof: 'id.pdf',
    },
  },
  {
    id: 'ver-2',
    type: 'pharmacy',
    name: 'City Pharmacy',
    image: 'https://ui-avatars.com/api/?name=City+Pharmacy&background=8b5cf6&color=fff&size=128&bold=true',
    owner: 'Priya Sharma',
    submittedAt: '2025-01-15',
    time: '10:30 AM',
    status: 'pending',
    email: 'citypharmacy@example.com',
    documents: {
      license: 'license.pdf',
      registration: 'registration.pdf',
    },
  },
  {
    id: 'ver-3',
    type: 'laboratory',
    name: 'Test Lab Services',
    image: 'https://ui-avatars.com/api/?name=Test+Lab&background=f59e0b&color=fff&size=128&bold=true',
    owner: 'Rajesh Kumar',
    submittedAt: '2025-01-15',
    time: '11:15 AM',
    status: 'pending',
    email: 'testlab@example.com',
    documents: {
      license: 'license.pdf',
      accreditation: 'accreditation.pdf',
    },
  },
]

// ============================================
// COMMON UTILITY FUNCTIONS
// ============================================

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatDate = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export const formatDateTime = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export const getStatusColor = (status) => {
  switch (status) {
    case 'completed':
    case 'delivered':
    case 'ready':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'pending':
    case 'preparing':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'cancelled':
      return 'bg-red-50 text-red-700 border-red-200'
    case 'confirmed':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}


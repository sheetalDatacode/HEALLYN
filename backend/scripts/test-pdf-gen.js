const fs = require('fs');
const path = require('path');
const { generatePrescriptionPDF } = require('../services/pdfService');

// Mock Data
const doctorData = {
    firstName: 'John',
    lastName: 'Doe',
    specialization: 'Cardiologist',
    clinicName: 'Heart Care Clinic',
    letterhead: {
        clinicName: 'Heart Care Clinic',
        address: '123 Medical Plaza, Health City',
        phone: '555-0123',
        email: 'dr.doe@example.com'
    },
    digitalSignature: {
        // Use a placeholder or null if testing without actual image
        imageUrl: null
    }
};

const patientData = {
    firstName: 'Jane',
    lastName: 'Smith',
    dateOfBirth: '1985-05-15',
    gender: 'Female',
    phone: '555-9876',
    address: {
        line1: '456 Patient Lane',
        city: 'Wellness Town',
        state: 'Health State',
        pincode: '12345'
    }
};

// Generate a large number of medications to force pagination
const medications = Array.from({ length: 15 }, (_, i) => ({
    name: `Medicine ${i + 1} with a very long name to test wrapping capabilities of the PDF generator`,
    dosage: '1 tablet',
    frequency: 'Twice daily',
    duration: '7 days',
    instructions: 'Take after meals with plenty of water. Do not operate heavy machinery.'
}));

// Generate a large number of investigations
const investigations = Array.from({ length: 10 }, (_, i) => ({
    name: `Investigation Test ${i + 1}`,
    notes: 'Check for abnormalities in the results.'
}));

const prescriptionData = {
    createdAt: new Date(),
    diagnosis: 'Hypertension, Type 2 Diabetes, and General Fatigue. Patient reports persistent headaches.',
    symptoms: [
        'Severe Headache',
        'Dizziness',
        'Blurred Vision',
        'Fatigue',
        'Nausea',
        'Shortness of Breath'
    ],
    medications: medications,
    investigations: investigations,
    advice: 'Patient needs to take rest and follow a strict diet. Avoid salty foods. brisk walking for 30 mins daily.',
    followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
};

async function runTest() {
    try {
        
        const pdfBuffer = await generatePrescriptionPDF(prescriptionData, doctorData, patientData);

        const outputPath = path.join(__dirname, 'test_prescription_output.pdf');
        fs.writeFileSync(outputPath, pdfBuffer);

        
    } catch (error) {
        console.error('Error generating PDF:', error);
    }
}

runTest();

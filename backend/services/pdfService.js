const PDFDocument = require('pdfkit');
const { uploadFromBuffer } = require('./fileUploadService');

/**
 * Generate prescription PDF
 * @param {Object} prescriptionData - Prescription data
 * @param {Object} doctorData - Doctor data
 * @param {Object} patientData - Patient data
 * @returns {Promise<Buffer>} PDF buffer
 */
const generatePrescriptionPDF = async (prescriptionData, doctorData, patientData) => {
  return new Promise((resolve, reject) => {
    try {
      // Enable bufferPages to support total page count
      const doc = new PDFDocument({ margin: 50, bufferPages: true });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Helper to check page break
      const checkPageBreak = (currentY, neededHeight) => {
        const bottomMargin = 50; // Bottom margin
        if (currentY + neededHeight > doc.page.height - bottomMargin) {
          doc.addPage();

          // Add simplified header on new pages
          let newY = 50;
          doc.fontSize(10).font('Helvetica-Bold').fillColor(150, 150, 150).text('Prescription Continuation', 50, newY, { align: 'center' });
          doc.fontSize(8).font('Helvetica').text(`Patient: ${patientData.firstName} ${patientData.lastName}`, 50, newY + 15, { align: 'center' });

          // Reset stroke/fill colors
          doc.strokeColor(0, 0, 0).fillColor(0, 0, 0);

          return 100; // Return new Y position for content (allowing space for header)
        }
        return currentY;
      };

      let yPos = 50;

      // --- Page 1 Header ---

      // Header - Healiinn (Above Clinic Name)
      doc.fontSize(24).font('Helvetica-Bold').fillColor(17, 73, 108).text('Healiinn', 50, yPos, { align: 'center' });
      yPos += 15;

      // Clinic Name (if available) - Below Healiinn
      if (doctorData.letterhead?.clinicName) {
        doc.fontSize(16).font('Helvetica').fillColor(0, 0, 0).text(doctorData.letterhead.clinicName, 50, yPos, { align: 'center' });
        yPos += 10;
      } else if (doctorData.clinicName) {
        doc.fontSize(16).font('Helvetica').fillColor(0, 0, 0).text(doctorData.clinicName, 50, yPos, { align: 'center' });
        yPos += 10;
      }

      // Clinic Address (if available)
      if (doctorData.letterhead?.address) {
        doc.fontSize(9).text(doctorData.letterhead.address, 50, yPos, { align: 'center' });
        yPos += 8;
      }

      // Contact Info
      if (doctorData.letterhead?.phone || doctorData.letterhead?.email) {
        const contactInfo = [];
        if (doctorData.letterhead.phone) contactInfo.push(`Phone: ${doctorData.letterhead.phone}`);
        if (doctorData.letterhead.email) contactInfo.push(`Email: ${doctorData.letterhead.email}`);
        doc.fontSize(9).text(contactInfo.join(' | '), 50, yPos, { align: 'center' });
        yPos += 15;
      }

      // Doctor Information (Left)
      yPos += 10; // Extra spacing before info block
      const startInfoY = yPos;

      doc.fontSize(12).font('Helvetica-Bold').fillColor(0, 0, 0).text('Doctor Information', 50, yPos);
      yPos += 15;
      doc.fontSize(10).font('Helvetica').text(`Name: Dr. ${doctorData.firstName} ${doctorData.lastName}`, 50, yPos);
      yPos += 12;
      doc.text(`Specialty: ${doctorData.specialization || 'General Physician'}`, 50, yPos);
      yPos += 12;
      doc.text(`Date: ${new Date(prescriptionData.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 50, yPos);
      yPos += 20;

      // Patient Information (Right)
      // Use the stored startInfoY to align with Doctor Info
      const patientYPos = startInfoY; // Align tops
      doc.fontSize(12).font('Helvetica-Bold').text('Patient Information', 400, patientYPos);
      let currentPatientY = patientYPos + 15;
      doc.fontSize(10).font('Helvetica').text(`Name: ${patientData.firstName} ${patientData.lastName}`, 400, currentPatientY);
      currentPatientY += 12;
      if (patientData.dateOfBirth) {
        const age = Math.floor((new Date() - new Date(patientData.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
        doc.text(`Age: ${age} years`, 400, currentPatientY);
        currentPatientY += 12;
      }
      doc.text(`Gender: ${patientData.gender || 'N/A'}`, 400, currentPatientY);
      currentPatientY += 12;
      if (patientData.phone) {
        doc.text(`Phone: ${patientData.phone}`, 400, currentPatientY);
        currentPatientY += 12;
      }
      if (patientData.address) {
        let addressText = '';
        if (typeof patientData.address === 'string') {
          addressText = patientData.address;
        } else if (typeof patientData.address === 'object') {
          // Build address string from object
          const addressParts = [];
          if (patientData.address.line1) addressParts.push(patientData.address.line1);
          if (patientData.address.line2) addressParts.push(patientData.address.line2);
          if (patientData.address.city) addressParts.push(patientData.address.city);
          if (patientData.address.state) addressParts.push(patientData.address.state);
          if (patientData.address.pincode || patientData.address.postalCode) {
            addressParts.push(patientData.address.pincode || patientData.address.postalCode);
          }
          addressText = addressParts.join(', ').trim();
        }

        if (addressText && addressText !== '[object Object]') {
          // Fix for splitTextToSize not being a function in pdfkit
          // Use heightOfString to calculate height needed
          const addressHeight = doc.heightOfString(`Address: ${addressText}`, { width: 150 });

          doc.text(`Address: ${addressText}`, 400, currentPatientY, { width: 150, align: 'left' });
          currentPatientY += addressHeight;
        }
      }

      // Set yPos to max of doctor and patient info + spacing
      yPos = Math.max(yPos, currentPatientY) + 20;

      // Horizontal Line Separator
      doc.strokeColor(200, 200, 200).moveTo(50, yPos).lineTo(550, yPos).stroke();
      yPos += 20;

      // --- Content Sections ---

      // Diagnosis Section
      yPos = checkPageBreak(yPos, 50); // Check enough space for header + content
      doc.fontSize(12).font('Helvetica-Bold').fillColor(0, 0, 0).text('Diagnosis', 50, yPos);
      yPos += 15;
      const diagnosisText = prescriptionData.diagnosis || prescriptionData.consultationId?.diagnosis || 'N/A';

      // Calculate height needed for diagnosis text
      doc.fontSize(10).font('Helvetica');
      const diagnosisOptions = { width: 500 };
      const diagnosisHeight = doc.heightOfString(diagnosisText, diagnosisOptions) + 10;

      // Check for page break before drawing background
      yPos = checkPageBreak(yPos, diagnosisHeight);

      doc.fillColor(230, 240, 255).rect(50, yPos - 5, 500, diagnosisHeight).fill();
      doc.fillColor(0, 0, 0).text(diagnosisText, 55, yPos, diagnosisOptions);
      yPos += diagnosisHeight + 15;

      // Symptoms Section
      const symptoms = prescriptionData.symptoms || prescriptionData.consultationId?.symptoms;
      if (symptoms) {
        yPos = checkPageBreak(yPos, 30);
        doc.fontSize(12).font('Helvetica-Bold').text('Symptoms', 50, yPos);
        yPos += 15;
        doc.fontSize(10).font('Helvetica');
        const symptomList = Array.isArray(symptoms) ? symptoms : (typeof symptoms === 'string' ? symptoms.split('\n').filter(s => s.trim()) : []);

        symptomList.forEach((symptom) => {
          const symptomText = typeof symptom === 'string' ? symptom.trim() : String(symptom);
          if (symptomText) {
            yPos = checkPageBreak(yPos, 15);
            doc.fillColor(34, 197, 94).circle(55, yPos + 3, 2, 'F');
            doc.fillColor(0, 0, 0).text(symptomText, 65, yPos);
            yPos += 15;
          }
        });
        yPos += 5;
      }

      // Medications Section
      if (prescriptionData.medications && prescriptionData.medications.length > 0) {
        yPos = checkPageBreak(yPos, 30);
        doc.fontSize(12).font('Helvetica-Bold').text('Medications', 50, yPos);
        yPos += 15;

        prescriptionData.medications.forEach((med, index) => {
          // Estimate height for this medication block
          // Default height is around 60, but adjust if text is long
          let blockHeight = 60;
          if (med.instructions && med.instructions.length > 30) blockHeight += 12; // Extra line for instructions

          yPos = checkPageBreak(yPos, blockHeight);

          doc.fontSize(10).font('Helvetica');
          doc.fillColor(245, 245, 245).rect(50, yPos - 5, 500, blockHeight - 10).fill();

          // Number circle
          doc.fillColor(17, 73, 108).circle(480, yPos + 15, 12, 'F');
          doc.fillColor(255, 255, 255).font('Helvetica-Bold').text(String(index + 1), 480, yPos + 11, { align: 'center', width: 24 });

          doc.fillColor(0, 0, 0).font('Helvetica-Bold').text(`${med.name || 'Medication'}`, 70, yPos);
          if (med.dosage) doc.font('Helvetica').text(`Dosage: ${med.dosage}`, 70, yPos + 15);
          if (med.frequency) doc.text(`Frequency: ${med.frequency}`, 70, yPos + 30);
          if (med.duration) doc.text(`Duration: ${med.duration}`, 250, yPos + 15); // Moved to right column to save space

          if (med.instructions) {
            doc.text(`Instructions: ${med.instructions}`, 70, yPos + 45, { width: 400 });
          }

          yPos += blockHeight;
        });
        yPos += 5;
      }

      // Investigations/Tests Section
      let investigations = prescriptionData.investigations;
      if (!investigations || investigations.length === 0) {
        if (prescriptionData.consultationId) {
          const consultation = prescriptionData.consultationId;
          if (consultation.investigations && Array.isArray(consultation.investigations) && consultation.investigations.length > 0) {
            investigations = consultation.investigations.map(inv => {
              const invObj = inv.toObject ? inv.toObject() : inv;
              return {
                name: invObj.testName || invObj.name || 'Investigation',
                testName: invObj.testName || invObj.name || 'Investigation',
                notes: invObj.notes || ''
              };
            });
          }
        }
      }

      if (investigations && Array.isArray(investigations) && investigations.length > 0) {
        yPos = checkPageBreak(yPos, 30);
        doc.fontSize(12).font('Helvetica-Bold').text('Investigations', 50, yPos);
        yPos += 15;
        doc.fontSize(10).font('Helvetica');

        investigations.forEach((inv, index) => {
          const invObj = inv.toObject ? inv.toObject() : inv;
          const invName = typeof invObj === 'string'
            ? invObj
            : (invObj.name || invObj.testName || 'Investigation');
          const invNotes = typeof invObj === 'object' ? (invObj.notes || '') : '';

          const testBoxHeight = invNotes ? 25 : 20;

          yPos = checkPageBreak(yPos, testBoxHeight);

          doc.fillColor(240, 230, 250).rect(50, yPos - 5, 500, testBoxHeight - 5, 2).fill();
          doc.fillColor(0, 0, 0).font('Helvetica-Bold').text(invName, 55, yPos);
          if (invNotes) {
            doc.fontSize(8).font('Helvetica').fillColor(80, 80, 80).text(invNotes, 55, yPos + 10);
            doc.fontSize(10); // Reset
          }
          yPos += testBoxHeight;
        });
        yPos += 10;
      }

      // Medical Advice/Notes
      const advice = prescriptionData.notes || prescriptionData.advice || prescriptionData.consultationId?.advice;
      if (advice) {
        yPos = checkPageBreak(yPos, 50);
        doc.fontSize(12).font('Helvetica-Bold').fillColor(0, 0, 0).text('Medical Advice', 50, yPos);
        yPos += 15;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.fillColor(0, 0, 0).text(advice, 50, yPos, { width: 500 });

        // Advance yPos by approximate height of advice
        const adviceHeight = doc.heightOfString(advice, { width: 500 });
        yPos += adviceHeight + 15;
      }

      // Follow-up Date
      if (prescriptionData.expiryDate || prescriptionData.followUpDate || prescriptionData.consultationId?.followUpDate) {
        const followUpDate = prescriptionData.expiryDate || prescriptionData.followUpDate || prescriptionData.consultationId?.followUpDate;
        if (followUpDate) {
          yPos = checkPageBreak(yPos, 40);
          doc.fontSize(12).font('Helvetica-Bold').text('Follow-up Appointment', 50, yPos);
          yPos += 15;
          doc.fontSize(10).font('Helvetica');
          const followUpDateStr = new Date(followUpDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
          doc.fillColor(255, 255, 200).rect(50, yPos - 5, 500, 20).fill();
          doc.fillColor(0, 0, 0).text(followUpDateStr, 55, yPos);
          yPos += 25;
        }
      }

      // --- Global Footer and Page Numbers ---
      const range = doc.bufferedPageRange(); // { start: 0, count: totalPages }

      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);

        // Footer Text
        const footerY = doc.page.height - 50;
        doc.fontSize(8).font('Helvetica').fillColor(100, 100, 100)
          .text('This is a digitally generated prescription. For any queries, please contact the clinic.', 50, footerY, { align: 'center', width: 500 });

        // Page Number
        doc.text(`Page ${i + 1} of ${range.count}`, 500, footerY, { align: 'right' });

        // Signature (Only on LAST page)
        if (i === range.start + range.count - 1) {
          if (doctorData.digitalSignature?.imageUrl) {
            // Check if there is space for signature, otherwise it might overlap last content (unlikely with pagination checks but good to note)
            try {
              doc.image(doctorData.digitalSignature.imageUrl, 400, footerY - 50, { width: 100 });
            } catch (e) {
              console.error('Error adding signature image:', e);
            }
          } else {
            // Draw signature line
            doc.strokeColor(0, 0, 0).lineWidth(0.5).moveTo(400, footerY - 30).lineTo(500, footerY - 30).stroke();
            doc.fontSize(8).font('Helvetica-Bold').fillColor(0, 0, 0).text(`Dr. ${doctorData.firstName} ${doctorData.lastName}`, 450, footerY - 20, { align: 'center' });
            doc.fontSize(7).font('Helvetica').text(doctorData.specialization || 'General Physician', 450, footerY - 10, { align: 'center' });
          }
        }
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate lab report PDF
 * @param {Object} reportData - Lab report data
 * @param {Object} laboratoryData - Laboratory data
 * @param {Object} patientData - Patient data
 * @returns {Promise<Buffer>} PDF buffer
 */
const generateLabReportPDF = async (reportData, laboratoryData, patientData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('Laboratory Report', 50, 50, { align: 'center' });
      doc.fontSize(12).text(laboratoryData.labName, 50, 75, { align: 'center' });

      // Patient Information
      doc.fontSize(14).text('Patient Information', 50, 120);
      doc.fontSize(10).text(`Name: ${patientData.firstName} ${patientData.lastName}`, 50, 140);
      if (patientData.dateOfBirth) {
        doc.text(`Date of Birth: ${new Date(patientData.dateOfBirth).toLocaleDateString()}`, 50, 155);
      }
      if (patientData.phone) {
        doc.text(`Phone: ${patientData.phone}`, 50, 170);
      }

      // Report Details
      doc.fontSize(14).text('Test Details', 50, 200);
      doc.fontSize(10).text(`Test Name: ${reportData.testName}`, 50, 220);
      doc.text(`Report Date: ${new Date(reportData.reportDate).toLocaleDateString()}`, 50, 235);

      // Results
      if (reportData.results && reportData.results.length > 0) {
        doc.fontSize(14).text('Test Results', 50, 265);
        let yPos = 285;

        // Table header
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Parameter', 50, yPos);
        doc.text('Value', 200, yPos);
        doc.text('Unit', 300, yPos);
        doc.text('Normal Range', 350, yPos);
        doc.text('Status', 450, yPos);

        yPos += 20;
        doc.font('Helvetica');

        reportData.results.forEach((result) => {
          doc.text(result.parameter || '-', 50, yPos);
          doc.text(result.value || '-', 200, yPos);
          doc.text(result.unit || '-', 300, yPos);
          doc.text(result.normalRange || '-', 350, yPos);
          doc.text(result.status || 'normal', 450, yPos);
          yPos += 20;
        });
      }

      // Notes
      if (reportData.notes) {
        doc.fontSize(14).text('Notes', 50, yPos + 20);
        doc.fontSize(10).text(reportData.notes, 50, yPos + 40, { width: 500 });
      }

      // Footer
      const footerY = doc.page.height - 50;
      doc.fontSize(8).text('This is a computer-generated report.', 50, footerY, { align: 'center' });
      doc.text(`Reported by: ${laboratoryData.labName}`, 50, footerY + 15, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Upload PDF to local storage and return URL
 * @param {Buffer} pdfBuffer - PDF buffer
 * @param {String} folder - Folder path (default: 'prescriptions')
 * @param {String} fileName - File name (optional)
 * @returns {Promise<String>} PDF URL
 */
const uploadPrescriptionPDF = async (pdfBuffer, folder = 'prescriptions', fileName = null) => {
  const result = await uploadFromBuffer(
    pdfBuffer,
    fileName || `prescription_${Date.now()}.pdf`,
    'application/pdf',
    folder,
    'prescription'
  );
  return result.url;
};

const uploadLabReportPDF = async (pdfBuffer, folder = 'reports', fileName = null) => {
  const result = await uploadFromBuffer(
    pdfBuffer,
    fileName || `report_${Date.now()}.pdf`,
    'application/pdf',
    folder,
    'report'
  );
  return result.url;
};

module.exports = {
  generatePrescriptionPDF,
  generateLabReportPDF,
  uploadPrescriptionPDF,
  uploadLabReportPDF,
};


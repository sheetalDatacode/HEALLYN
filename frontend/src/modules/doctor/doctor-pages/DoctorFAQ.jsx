import { IoHelpCircleOutline } from 'react-icons/io5'
import FAQPage from '../../../components/legal/FAQPage'

const doctorFaqCategories = [
  {
    id: 'general',
    title: 'General Questions',
    icon: IoHelpCircleOutline,
    color: 'from-blue-500 to-blue-600',
    questions: [
      {
        id: 'q1',
        question: 'How do I get started with Heallyn?',
        answer: 'Getting started is easy! Simply register your account, complete your profile verification, and you can start managing your practice. Our onboarding process guides you through each step to ensure a smooth setup.',
      },
      {
        id: 'q2',
        question: 'What features are available for doctors?',
        answer: 'Heallyn offers comprehensive features including patient management, appointment scheduling, consultation management, prescription generation, wallet management, and detailed analytics. All features are designed to streamline your practice operations.',
      },
      {
        id: 'q3',
        question: 'Is my data secure?',
        answer: 'Yes, absolutely! We use industry-standard encryption and follow HIPAA compliance guidelines. Your patient data and practice information are protected with advanced security measures and regular security audits.',
      },
      {
        id: 'q4',
        question: 'Can I customize my profile?',
        answer: 'Yes, you can fully customize your profile including clinic information, consultation fees, availability timings, specialization details, and professional qualifications. All changes can be made from your Profile section.',
      },
    ],
  },
  {
    id: 'appointments',
    title: 'Appointments & Scheduling',
    icon: IoHelpCircleOutline,
    color: 'from-emerald-500 to-emerald-600',
    questions: [
      {
        id: 'q5',
        question: 'How do I manage my appointments?',
        answer: 'You can view and manage all your appointments from the Appointments section. You can see today\'s schedule, upcoming appointments, and manage your availability. The system automatically updates appointment statuses.',
      },
      {
        id: 'q6',
        question: 'Can patients book appointments directly?',
        answer: 'Yes, patients can book appointments directly through the platform. You can set your availability, consultation fees, and preferred time slots. You\'ll receive notifications for new appointment requests.',
      },
      {
        id: 'q7',
        question: 'How do I cancel or reschedule an appointment?',
        answer: 'You can cancel or reschedule appointments from the Appointments page. Simply select the appointment and choose the appropriate action. Patients will be notified automatically of any changes.',
      },
      {
        id: 'q8',
        question: 'What happens if a patient doesn\'t show up?',
        answer: 'You can mark appointments as "No Show" from the appointment details. This helps track patient attendance and can be useful for future reference. The appointment will be marked accordingly in your records.',
      },
    ],
  },
  {
    id: 'consultations',
    title: 'Consultations & Prescriptions',
    icon: IoHelpCircleOutline,
    color: 'from-purple-500 to-purple-600',
    questions: [
      {
        id: 'q9',
        question: 'How do I create a prescription?',
        answer: 'During a consultation, you can access the prescription module. Add medications, dosages, instructions, and generate a digital prescription that can be shared with patients and pharmacies.',
      },
      {
        id: 'q10',
        question: 'Can I save consultation notes?',
        answer: 'Yes, you can save detailed consultation notes including patient history, diagnosis, treatment plans, and follow-up instructions. All notes are securely stored and can be accessed anytime.',
      },
      {
        id: 'q11',
        question: 'How do I view patient history?',
        answer: 'Patient history is available in the Patients section. Click on any patient to view their complete medical history, past consultations, prescriptions, and test results in one place.',
      },
      {
        id: 'q12',
        question: 'Can I generate reports?',
        answer: 'Yes, you can generate various reports including consultation summaries, patient reports, and practice analytics. Reports can be exported in PDF format for your records.',
      },
    ],
  },
  {
    id: 'payments',
    title: 'Payments & Wallet',
    icon: IoHelpCircleOutline,
    color: 'from-amber-500 to-amber-600',
    questions: [
      {
        id: 'q13',
        question: 'How do I receive payments?',
        answer: 'Payments are automatically processed through the platform. Consultation fees are credited to your wallet after each completed consultation. You can view all transactions in your Wallet section.',
      },
      {
        id: 'q14',
        question: 'How do I withdraw my earnings?',
        answer: 'You can withdraw your earnings from the Wallet section. Navigate to the Withdraw tab, enter the amount, and provide your bank details. Withdrawals are processed within 2-3 business days.',
      },
      {
        id: 'q15',
        question: 'What payment methods are supported?',
        answer: 'We support multiple payment methods including bank transfers, UPI, and digital wallets. All payment methods are secure and comply with financial regulations.',
      },
      {
        id: 'q16',
        question: 'Are there any transaction fees?',
        answer: 'Transaction fees may apply depending on the payment method and amount. Detailed fee structure is available in your Wallet section. We maintain transparency in all financial transactions.',
      },
    ],
  },
  {
    id: 'technical',
    title: 'Technical Support',
    icon: IoHelpCircleOutline,
    color: 'from-indigo-500 to-indigo-600',
    questions: [
      {
        id: 'q17',
        question: 'What if I face technical issues?',
        answer: 'If you encounter any technical issues, you can contact our support team through the Support section. We provide 24/7 technical assistance to ensure smooth operation of the platform.',
      },
      {
        id: 'q18',
        question: 'Is there a mobile app?',
        answer: 'Currently, Heallyn is available as a web application optimized for all devices. We are working on dedicated mobile apps for iOS and Android, which will be available soon.',
      },
      {
        id: 'q19',
        question: 'Can I use the platform offline?',
        answer: 'Some features require an internet connection for real-time updates. However, you can view previously loaded data offline. We recommend maintaining a stable internet connection for the best experience.',
      },
      {
        id: 'q20',
        question: 'How do I update my account information?',
        answer: 'You can update your account information anytime from the Profile section. Changes to critical information may require verification. All updates are saved automatically.',
      },
    ],
  },
]

const DoctorFAQ = () => {
  return <FAQPage faqCategories={doctorFaqCategories} supportRoute="/doctor/support" />
}

export default DoctorFAQ

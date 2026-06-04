import { IoHelpCircleOutline } from 'react-icons/io5'
import FAQPage from '../../../components/legal/FAQPage'

const faqCategories = [
  {
    id: 'general',
    title: 'General Questions',
    icon: IoHelpCircleOutline,
    color: 'from-blue-500 to-blue-600',
    questions: [
      {
        id: 'q1',
        question: 'How do I get started with Heallyn?',
        answer: 'Getting started is easy! Simply register your laboratory account, complete your profile verification with accreditation details, and you can start receiving test orders. Our onboarding process guides you through each step.',
      },
      {
        id: 'q2',
        question: 'What features are available for laboratories?',
        answer: 'Heallyn offers comprehensive features including test order management, report generation, patient management, inventory tracking, wallet management, and detailed analytics. All features are designed to streamline your laboratory operations.',
      },
      {
        id: 'q3',
        question: 'Is my data secure?',
        answer: 'Yes, absolutely! We use industry-standard encryption and follow HIPAA compliance guidelines. Your patient data and laboratory information are protected with advanced security measures and regular security audits.',
      },
      {
        id: 'q4',
        question: 'Can I customize my laboratory profile?',
        answer: 'Yes, you can fully customize your profile including laboratory information, available tests, pricing, operating hours, and professional qualifications. All changes can be made from your Profile section.',
      },
    ],
  },
  {
    id: 'orders',
    title: 'Test Orders & Processing',
    icon: IoHelpCircleOutline,
    color: 'from-emerald-500 to-emerald-600',
    questions: [
      {
        id: 'q5',
        question: 'How do I receive test orders?',
        answer: 'Test orders are automatically sent to your laboratory when patients or doctors request tests. You\'ll receive notifications for new orders and can view them in the Orders section.',
      },
      {
        id: 'q6',
        question: 'How do I process a test order?',
        answer: 'Once you receive an order, confirm it, collect the sample (if needed), perform the test, and generate the report. Upload the report through the platform and it will be automatically shared with the patient and ordering physician.',
      },
      {
        id: 'q7',
        question: 'What if I need to cancel an order?',
        answer: 'You can cancel orders from the Orders page if necessary. Patients and doctors will be notified automatically. Refund policies apply based on the cancellation reason.',
      },
      {
        id: 'q8',
        question: 'How long do I have to complete a test?',
        answer: 'Test completion times vary by test type. Standard tests should be completed within 24-48 hours. Urgent tests may have shorter timeframes. Check the order details for specific requirements.',
      },
    ],
  },
  {
    id: 'reports',
    title: 'Reports & Results',
    icon: IoHelpCircleOutline,
    color: 'from-purple-500 to-purple-600',
    questions: [
      {
        id: 'q9',
        question: 'How do I generate test reports?',
        answer: 'After completing a test, navigate to the Test Reports section, select the order, and use the report generation tool. Include all required test parameters, results, and reference ranges.',
      },
      {
        id: 'q10',
        question: 'What format should reports be in?',
        answer: 'Reports should be in PDF format and include laboratory letterhead, test results, reference ranges, and any necessary interpretations. Templates are available in the platform.',
      },
      {
        id: 'q11',
        question: 'Can I view past reports?',
        answer: 'Yes, all generated reports are stored in your Reports section. You can search, filter, and view historical reports for any patient or time period.',
      },
      {
        id: 'q12',
        question: 'How do patients receive their reports?',
        answer: 'Reports are automatically shared with patients and ordering physicians through the platform. Patients receive notifications and can download reports from their account.',
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
        answer: 'Payments are automatically processed through the platform. Test fees are credited to your wallet after report delivery. You can view all transactions in your Wallet section.',
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

const LaboratoryFAQ = () => {
  return <FAQPage faqCategories={faqCategories} supportRoute="/laboratory/support" />
}

export default LaboratoryFAQ

import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  IoHeartOutline,
  IoCalendarOutline,
  IoDocumentsOutline,
  IoPeopleOutline,
  IoShieldCheckmarkOutline,
  IoPhonePortraitOutline,
  IoCheckmarkCircleOutline,
  IoArrowForwardOutline,
  IoStarOutline,
  IoLocationOutline,
  IoTimeOutline,
  IoCallOutline,
  IoMailOutline,
  IoLogoWhatsapp,
  IoChevronDownOutline,
  IoWalletOutline,
  IoNotificationsOutline,
  IoHomeOutline,
} from 'react-icons/io5'
import {
  FaUserMd,
  FaPills,
  FaFlask,
  FaStethoscope,
  FaHeartbeat,
  FaXRay,
  FaNotesMedical,
  FaHospital,
  FaChartLine,
  FaMobileAlt,
  FaClock,
  FaUserCheck,
  FaShieldAlt,
  FaGooglePlay,
} from 'react-icons/fa'
import {
  HiOutlineAcademicCap,
  HiOutlineCalendar,
  HiOutlineChartBar,
} from 'react-icons/hi'
import WebNavbar from '../web-components/WebNavbar'
import WebFooter from '../web-components/WebFooter'
import DoctorBenefitsCarousel from '../web-components/DoctorBenefitsCarousel'
import LaboratoryBenefitsGrid from '../web-components/LaboratoryBenefitsGrid'
import heroImage from '../../../assets/images/img1.png'
import featuresImage from '../../../assets/images/img5.png'
import doctorImage from '../../../assets/images/img2.png'
import pharmacyImage from '../../../assets/images/img3.png'
import nurseImage from '../../../assets/images/img6.png'
import healinnLogo from '../../../assets/images/logo.png'

const Home = () => {
  const navigate = useNavigate()

  const scrollToSection = (sectionId) => {
    const element = document.querySelector(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const features = [
    {
      icon: FaStethoscope,
      title: 'Online Consultations',
      keyPoints: ['Video & Audio Calls', '24/7 Available', 'Instant Prescriptions'],
      color: 'blue',
    },
    {
      icon: IoCalendarOutline,
      title: 'Easy Appointments',
      keyPoints: ['Flexible Scheduling', 'Smart Reminders', 'Reschedule Anytime'],
      color: 'green',
    },
    {
      icon: FaFlask,
      title: 'Lab Tests',
      keyPoints: ['Home Collection', 'Digital Reports', 'Quick Results'],
      color: 'amber',
    },
    {
      icon: FaPills,
      title: 'Medicine Delivery',
      keyPoints: ['Fast Delivery', 'Verified Pharmacy', 'Prescription Upload'],
      color: 'purple',
    },
    {
      icon: IoDocumentsOutline,
      title: 'Health Records',
      keyPoints: ['Secure Storage', 'Easy Access', 'Share Anytime'],
      color: 'teal',
    },
    {
      icon: IoShieldCheckmarkOutline,
      title: 'Secure & Private',
      keyPoints: ['HIPAA Compliant', 'Encrypted Data', 'Privacy First'],
      color: 'red',
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <WebNavbar />
      
      {/* Hero Section */}
      <section
        className="relative min-h-screen flex items-center overflow-hidden pt-16 md:pt-20"
        style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)',
        }}
      >
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#11496c]/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#10b981]/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 md:pt-12 md:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Side - Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="text-left space-y-6 md:space-y-8"
            >
              <div className="space-y-4 md:space-y-6">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 leading-tight">
                  Your Health,{' '}
                  <span className="text-[#11496c]">Simplified</span>
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl text-slate-600 leading-relaxed max-w-xl">
                  Connect with trusted doctors, order lab tests, and get medicines delivered to your doorstep. All in one place.
                </p>
              </div>
              
              {/* Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-start gap-4 pt-4"
              >
                <button
                  onClick={() => navigate('/onboarding')}
                  className="w-full sm:w-auto px-8 py-4 bg-[#11496c] text-white rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 hover:bg-[#0d3a54]"
                >
                  <span>Get Started</span>
                  <IoArrowForwardOutline className="text-xl" />
                </button>
                <button
                  onClick={() => scrollToSection('#features')}
                  className="w-full sm:w-auto px-8 py-4 bg-white text-[#11496c] rounded-xl text-lg font-semibold border-2 border-[#11496c] hover:bg-[#11496c]/5 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <span>Learn More</span>
                  <IoChevronDownOutline className="text-xl" />
                </button>
              </motion.div>
            </motion.div>

            {/* Right Side - Image */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
              className="flex items-center justify-center lg:justify-end"
            >
              <img
                src={heroImage}
                alt="Healthcare Services"
                className="w-full h-auto object-contain"
              />
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 hidden md:block">
          <IoChevronDownOutline className="text-3xl text-[#11496c] animate-bounce" />
        </div>
      </section>

      {/* App Coming Soon Section */}
      <section className="relative py-12 md:py-16 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 right-10 w-48 h-48 bg-[#11496c]/5 rounded-full blur-2xl" />
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-indigo-500/5 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-16 xl:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center max-w-5xl mx-auto">
            {/* Left Side - Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="text-center lg:text-left space-y-4 order-2 lg:order-1"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                <IoNotificationsOutline className="text-base" />
                <span>Mobile App Launching Soon</span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
                Get Our{' '}
                <span className="text-[#11496c]">Mobile App</span>
                <br />
                on Your Device
              </h2>
              
              <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0">
                Experience seamless healthcare management with our mobile app. Available for patients and healthcare providers.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 pt-2">
                {/* Patient App Button */}
                <div className="group relative flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl shadow-lg overflow-hidden opacity-75 cursor-default">
                  <FaGooglePlay className="text-xl shrink-0" />
                  <div className="text-left">
                    <div className="text-[10px] text-white/80">Patient App</div>
                    <div className="text-sm font-bold leading-none">Google Play</div>
                  </div>
                </div>

                {/* Provider App Button (Doctors/Pharmacy/Labs) */}
                <div className="group relative flex items-center justify-center gap-2 px-5 py-3 bg-[#11496c] text-white rounded-xl shadow-lg overflow-hidden opacity-75 cursor-default">
                  <FaGooglePlay className="text-xl shrink-0" />
                  <div className="text-left">
                    <div className="text-[10px] text-white/80">Provider App</div>
                    <div className="text-sm font-bold leading-none">Google Play</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <IoCheckmarkCircleOutline className="text-green-500 text-base" />
                  <span>For Patients</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <IoCheckmarkCircleOutline className="text-green-500 text-base" />
                  <span>For Doctors, Pharmacy & Labs</span>
                </div>
              </div>
            </motion.div>

            {/* Right Side - Visual */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
              className="relative flex items-center justify-center order-1 lg:order-2"
            >
              <div className="relative w-full max-w-[180px] mx-auto">
                {/* Phone mockup container */}
                <div className="relative mx-auto">
                  {/* Phone frame */}
                  <div className="relative bg-slate-900 rounded-[1.5rem] p-1 shadow-2xl">
                    <div className="bg-white rounded-[1.25rem] overflow-hidden">
                      {/* Phone notch */}
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-14 h-2.5 bg-slate-900 rounded-b-sm z-10" />
                      
                      {/* Screen content - Full screen mobile */}
                      <div className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 aspect-[9/19.5] flex flex-col">
                        {/* Status bar */}
                        <div className="flex items-center justify-between px-2.5 pt-1.5 pb-1 text-[8px] text-slate-600">
                          <span>9:41</span>
                          <div className="flex items-center gap-0.5">
                            <div className="w-1.5 h-0.5 border border-slate-600 rounded-sm">
                              <div className="w-1 h-full bg-slate-600 rounded-sm" />
                            </div>
                            <div className="w-2 h-0.5 border border-slate-600 rounded-sm">
                              <div className="w-1.5 h-full bg-slate-600 rounded-sm" />
                            </div>
                          </div>
                        </div>

                        {/* Full screen content with logo */}
                        <div className="flex-1 flex flex-col items-center justify-center px-2.5 space-y-2.5">
                          {/* Logo */}
                          <div className="relative">
                            <div className="absolute inset-0 bg-[#11496c]/10 rounded-lg blur-lg" />
                            <div className="relative bg-white rounded-lg p-2.5 shadow-lg">
                              <img
                                src={healinnLogo}
                                alt="Heallyn Logo"
                                className="w-12 h-12 object-contain"
                              />
                            </div>
                          </div>
                          
                          {/* App name */}
                          <div className="text-center space-y-0.5">
                            <h3 className="text-sm font-bold text-slate-900">Heallyn</h3>
                            <p className="text-[8px] text-slate-600">Your Health Companion</p>
                          </div>

                          {/* Coming soon badge */}
                          <div className="px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md border border-white/50">
                            <div className="flex items-center gap-0.5 text-slate-700">
                              <IoNotificationsOutline className="text-blue-500 text-[9px]" />
                              <span className="font-semibold text-[8px]">Launching Soon</span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom navigation area */}
                        <div className="px-2.5 pb-1.5 pt-1 border-t border-slate-200/50">
                          <div className="h-0.5 w-10 bg-slate-300 rounded-full mx-auto" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating elements */}
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
                  <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-indigo-500/20 rounded-full blur-xl animate-pulse" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-20 md:py-32 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Everything You Need for{' '}
              <span className="text-[#11496c]">Better Health</span>
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Comprehensive healthcare services at your fingertips, designed to make your health journey seamless and convenient.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Side - Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center justify-center lg:justify-start order-2 lg:order-1"
            >
              <img
                src={featuresImage}
                alt="Healthcare Features"
                className="w-full max-w-sm h-auto object-contain"
              />
            </motion.div>

            {/* Right Side - Key Points */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="order-1 lg:order-2"
            >
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="grid grid-cols-2 gap-3"
              >
                {features.map((feature) => (
                  <div
                    key={feature.title}
                    className="group relative bg-white rounded-lg p-3 shadow-sm border border-slate-100 overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer"
                  >
                    {/* Subtle gradient overlay */}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                      feature.color === 'blue' ? 'bg-gradient-to-br from-blue-50/30 to-transparent' :
                      feature.color === 'green' ? 'bg-gradient-to-br from-green-50/30 to-transparent' :
                      feature.color === 'amber' ? 'bg-gradient-to-br from-amber-50/30 to-transparent' :
                      feature.color === 'purple' ? 'bg-gradient-to-br from-purple-50/30 to-transparent' :
                      feature.color === 'teal' ? 'bg-gradient-to-br from-teal-50/30 to-transparent' :
                      'bg-gradient-to-br from-red-50/30 to-transparent'
                    }`} />
                    
                    {/* Subtle corner accent */}
                    <div className={`absolute top-0 right-0 w-12 h-12 opacity-0 group-hover:opacity-20 transition-opacity duration-300 ${
                      feature.color === 'blue' ? 'bg-blue-200' :
                      feature.color === 'green' ? 'bg-green-200' :
                      feature.color === 'amber' ? 'bg-amber-200' :
                      feature.color === 'purple' ? 'bg-purple-200' :
                      feature.color === 'teal' ? 'bg-teal-200' :
                      'bg-red-200'
                    } rounded-bl-full`} />

                    <div className="relative z-10">
                      {/* Icon Container with gradient */}
                      <div className={`inline-flex p-2 rounded-lg mb-2 shadow-sm transition-transform duration-300 group-hover:scale-110 ${
                        feature.color === 'blue' ? 'bg-gradient-to-br from-blue-100 to-blue-50' :
                        feature.color === 'green' ? 'bg-gradient-to-br from-green-100 to-green-50' :
                        feature.color === 'amber' ? 'bg-gradient-to-br from-amber-100 to-amber-50' :
                        feature.color === 'purple' ? 'bg-gradient-to-br from-purple-100 to-purple-50' :
                        feature.color === 'teal' ? 'bg-gradient-to-br from-teal-100 to-teal-50' :
                        'bg-gradient-to-br from-red-100 to-red-50'
                      }`}>
                        <feature.icon className={`text-xl drop-shadow-sm transition-all duration-300 group-hover:drop-shadow-md ${
                          feature.color === 'blue' ? 'text-blue-600' :
                          feature.color === 'green' ? 'text-green-600' :
                          feature.color === 'amber' ? 'text-amber-600' :
                          feature.color === 'purple' ? 'text-purple-600' :
                          feature.color === 'teal' ? 'text-teal-600' :
                          'text-red-600'
                        }`} />
                      </div>
                      
                      <h3 className="text-sm font-bold text-slate-900 mb-1.5 transition-colors duration-300 group-hover:text-[#11496c]">
                        {feature.title}
                      </h3>
                      
                      <ul className="space-y-1">
                        {feature.keyPoints.map((point, idx) => (
                          <li 
                            key={point} 
                            className="flex items-center gap-1.5 text-xs text-slate-600 transition-transform duration-200 group-hover:translate-x-1"
                            style={{ transitionDelay: `${idx * 30}ms` }}
                          >
                            <IoCheckmarkCircleOutline className="text-green-500 shrink-0 text-xs transition-transform duration-200 group-hover:scale-110" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Subtle bottom accent line */}
                    <div className={`absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                      feature.color === 'blue' ? 'bg-blue-400' :
                      feature.color === 'green' ? 'bg-green-400' :
                      feature.color === 'amber' ? 'bg-amber-400' :
                      feature.color === 'purple' ? 'bg-purple-400' :
                      feature.color === 'teal' ? 'bg-teal-400' :
                      'bg-red-400'
                    }`} />
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>

          {/* Call to Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center mt-12"
          >
            <button
              onClick={() => navigate('/onboarding')}
              className="px-8 py-4 bg-[#11496c] text-white rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 mx-auto"
            >
              <span>Get Started</span>
              <IoArrowForwardOutline className="text-xl" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* For Doctors Section */}
      <section
        id="doctors"
        className="py-20 md:py-32 text-white relative overflow-hidden"
        style={{
          background: 'linear-gradient(to bottom right, #11496c, #0d3a54)',
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center justify-center p-3 bg-white/20 rounded-full mb-6">
              <FaUserMd className="text-4xl" />
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Join Heallyn as a Doctor
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Expand your practice and reach more patients. Manage consultations, appointments, and earnings all in one platform.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center"
          >
            {/* Left Side - Cards Carousel */}
            <div className="order-2 lg:order-1 flex justify-center lg:justify-start">
              <DoctorBenefitsCarousel
                items={[
                  {
                    icon: HiOutlineCalendar,
                    title: 'Flexible Schedule',
                    description: 'Set your own availability and manage appointments efficiently. Work from anywhere, anytime.',
                  },
                  {
                    icon: FaChartLine,
                    title: 'Grow Your Practice',
                    description: 'Reach thousands of patients looking for quality healthcare. Build your reputation with verified reviews.',
                  },
                  {
                    icon: IoShieldCheckmarkOutline,
                    title: 'Secure Platform',
                    description: 'HIPAA-compliant platform with encrypted patient data. Focus on what you do best - treating patients.',
                  },
                  {
                    icon: IoWalletOutline,
                    title: 'Easy Payments',
                    description: 'Get paid securely and on time. Track your earnings and withdraw funds directly to your bank account.',
                  },
                  {
                    icon: HiOutlineChartBar,
                    title: 'Analytics Dashboard',
                    description: 'Monitor your practice performance with detailed analytics and insights about your consultations.',
                  },
                  {
                    icon: FaUserCheck,
                    title: 'Patient Management',
                    description: 'Access patient history, prescriptions, and medical records all in one centralized location.',
                  },
                ]}
                baseWidth={320}
                autoplay={true}
                autoplayDelay={3500}
                pauseOnHover={true}
                loop={true}
              />
            </div>

            {/* Right Side - Image */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex items-center justify-center lg:justify-end order-1 lg:order-2"
            >
              <img
                src={doctorImage}
                alt="Doctor Dashboard"
                className="w-full max-w-md lg:max-w-lg h-auto object-contain"
              />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-12"
          >
            <button
              onClick={() => navigate('/onboarding')}
              className="px-8 py-4 bg-white text-[#11496c] rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 mx-auto"
            >
              <span>Join as Doctor</span>
              <IoArrowForwardOutline className="text-xl" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* For Labs Section */}
      <section
        id="labs"
        className="py-20 md:py-32"
        style={{
          background: 'linear-gradient(to bottom right, rgb(255 251 235), rgb(255 237 213))',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center justify-center p-3 bg-amber-100 rounded-full mb-6">
              <FaFlask className="text-4xl text-amber-600" />
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Partner with Heallyn as a Laboratory
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Expand your reach and streamline operations. Manage test orders, reports, and deliveries efficiently.
            </p>
          </motion.div>

          <div className="mb-12">
            <LaboratoryBenefitsGrid
              items={[
                {
                  icon: FaXRay,
                  title: 'Digital Reports',
                  description: 'Generate and share digital test reports instantly. Reduce paper usage and improve efficiency.',
                },
                {
                  icon: IoPhonePortraitOutline,
                  title: 'Online Orders',
                  description: 'Receive test orders directly through the platform. Manage bookings and schedules seamlessly.',
                },
                {
                  icon: FaClock,
                  title: 'Faster Turnaround',
                  description: 'Streamline your workflow with our integrated system. Faster processing and better customer satisfaction.',
                },
                {
                  icon: HiOutlineAcademicCap,
                  title: 'Quality Standards',
                  description: 'Showcase your accreditations and certifications. Build trust with patients through verified credentials.',
                },
                {
                  icon: IoWalletOutline,
                  title: 'Secure Payments',
                  description: 'Get paid quickly and securely. Automated payment processing for all test orders.',
                },
                {
                  icon: FaNotesMedical,
                  title: 'Patient History',
                  description: 'Access complete patient test history to provide better recommendations and care.',
                },
              ]}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center"
          >
            <button
              onClick={() => navigate('/onboarding')}
              className="px-8 py-4 bg-amber-600 text-white rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 mx-auto"
            >
              <span>Join as Laboratory</span>
              <IoArrowForwardOutline className="text-xl" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* For Pharmacy Section */}
      <section
        id="pharmacy"
        className="py-20 md:py-32"
        style={{
          background: 'linear-gradient(to bottom right, rgb(250 245 255), rgb(238 242 255))',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center justify-center p-3 bg-purple-100 rounded-full mb-6">
              <FaPills className="text-4xl text-purple-600" />
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Become a Partner Pharmacy
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Connect with patients in your area. Deliver medicines faster and grow your pharmacy business online.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center"
          >
            {/* Left Side - Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex items-center justify-center lg:justify-start order-2 lg:order-1"
            >
              <img
                src={pharmacyImage}
                alt="Pharmacy Services"
                className="w-full max-w-md lg:max-w-lg h-auto object-contain"
              />
            </motion.div>

            {/* Right Side - Cards */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="order-1 lg:order-2"
            >
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-3"
              >
                {[
                  {
                    icon: FaMobileAlt,
                    title: 'Order Management',
                    description: 'Receive and manage medicine orders in real-time. Streamline your delivery operations.',
                  },
                  {
                    icon: IoLocationOutline,
                    title: 'Location-Based',
                    description: 'Serve patients in your area. Set delivery zones and manage local deliveries efficiently.',
                  },
                  {
                    icon: IoShieldCheckmarkOutline,
                    title: 'Verified Pharmacy',
                    description: 'Get verified status to build patient trust. Display your licenses and certifications.',
                  },
                  {
                    icon: FaClock,
                    title: 'Quick Delivery',
                    description: 'Fast delivery options to meet patient needs. Track orders and update status in real-time.',
                  },
                  {
                    icon: IoWalletOutline,
                    title: 'Easy Payments',
                    description: 'Get paid securely for every order. Automated payment processing and easy withdrawals.',
                  },
                  {
                    icon: FaChartLine,
                    title: 'Business Growth',
                    description: 'Access analytics to understand demand patterns and optimize your inventory management.',
                  },
                ].map((benefit) => (
                  <div
                    key={benefit.title}
                    className="group relative bg-white rounded-lg p-3 shadow-md border border-purple-50 overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer"
                  >
                    {/* Subtle gradient overlay */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-purple-50/30 to-transparent" />
                    
                    {/* Subtle corner accent */}
                    <div className="absolute top-0 right-0 w-12 h-12 opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-purple-200 rounded-bl-full" />

                    <div className="relative z-10">
                      <benefit.icon className="text-2xl text-purple-600 mb-2 transition-transform duration-300 group-hover:scale-110" />
                      <h3 className="text-sm font-bold text-slate-900 mb-1.5 transition-colors duration-300 group-hover:text-purple-700">{benefit.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed transition-transform duration-200 group-hover:translate-x-0.5">{benefit.description}</p>
                    </div>

                    {/* Subtle bottom accent line */}
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-purple-400" />
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
          
          <div className="mb-12" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center"
          >
            <button
              onClick={() => navigate('/onboarding')}
              className="px-8 py-4 bg-purple-600 text-white rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 mx-auto"
            >
              <span>Join as Pharmacy</span>
              <IoArrowForwardOutline className="text-xl" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* For Nurses Section */}
      <section
        id="nurses"
        className="py-20 md:py-32 text-white relative overflow-hidden"
        style={{
          background: 'linear-gradient(to bottom right, #11496c, #0d3a54)',
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center justify-center p-3 bg-white/20 rounded-full mb-6">
              <FaHeartbeat className="text-4xl" />
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Join Heallyn as a Nurse
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Provide quality home care services and expand your nursing practice. Manage bookings, patients, and earnings all in one platform.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center"
          >
            {/* Left Side - Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex items-center justify-center lg:justify-start order-2 lg:order-1"
            >
              <img
                src={nurseImage}
                alt="Nurse Services"
                className="w-full max-w-md lg:max-w-lg h-auto object-contain"
              />
            </motion.div>

            {/* Right Side - Cards */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="order-1 lg:order-2"
            >
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-3"
              >
                {[
                  {
                    icon: IoHomeOutline,
                    title: 'Home Care Services',
                    description: 'Provide quality nursing care at patients\' homes. Flexible scheduling and patient management tools.',
                  },
                  {
                    icon: IoCalendarOutline,
                    title: 'Flexible Schedule',
                    description: 'Set your own availability and manage bookings efficiently. Work on your own terms.',
                  },
                  {
                    icon: IoPeopleOutline,
                    title: 'Patient Management',
                    description: 'Access complete patient history and care records. Provide better continuity of care.',
                  },
                  {
                    icon: IoShieldCheckmarkOutline,
                    title: 'Secure Platform',
                    description: 'HIPAA-compliant platform with encrypted patient data. Focus on providing quality care.',
                  },
                  {
                    icon: IoWalletOutline,
                    title: 'Easy Payments',
                    description: 'Get paid securely and on time. Track your earnings and withdraw funds directly to your bank account.',
                  },
                  {
                    icon: FaChartLine,
                    title: 'Professional Growth',
                    description: 'Build your reputation with verified reviews and expand your nursing practice online.',
                  },
                ].map((benefit) => (
                  <div
                    key={benefit.title}
                    className="group relative bg-white/10 backdrop-blur-sm rounded-lg p-3 shadow-md border border-white/20 overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer"
                  >
                    {/* Subtle gradient overlay */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/10 to-transparent" />
                    
                    {/* Subtle corner accent */}
                    <div className="absolute top-0 right-0 w-12 h-12 opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-white/30 rounded-bl-full" />

                    <div className="relative z-10">
                      <benefit.icon className="text-2xl text-white mb-2 transition-transform duration-300 group-hover:scale-110" />
                      <h3 className="text-sm font-bold text-white mb-1.5 transition-colors duration-300 group-hover:text-white">{benefit.title}</h3>
                      <p className="text-xs text-white/80 leading-relaxed transition-transform duration-200 group-hover:translate-x-0.5">{benefit.description}</p>
                    </div>

                    {/* Subtle bottom accent line */}
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/50" />
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
          
          <div className="mb-12" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center"
          >
            <button
              onClick={() => navigate('/onboarding')}
              className="px-8 py-4 bg-white text-[#11496c] rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 mx-auto"
            >
              <span>Join as Nurse</span>
              <IoArrowForwardOutline className="text-xl" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Why Choose Heallyn Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Why Choose <span className="text-[#11496c]">Heallyn</span>?
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              We're committed to making healthcare accessible, convenient, and reliable for everyone.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
          >
            {[
              {
                icon: FaShieldAlt,
                title: 'Verified Providers',
                description: 'All doctors, labs, and pharmacies are verified and licensed.',
                color: 'blue',
              },
              {
                icon: IoTimeOutline,
                title: '24/7 Availability',
                description: 'Access healthcare services anytime, anywhere.',
                color: 'green',
              },
              {
                icon: IoShieldCheckmarkOutline,
                title: 'Secure & Private',
                description: 'Your data is encrypted and protected with HIPAA compliance.',
                color: 'purple',
              },
              {
                icon: IoHeartOutline,
                title: 'Patient First',
                description: 'Our platform is designed with your health and convenience in mind.',
                color: 'red',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative"
              >
                <motion.div
                  className="relative h-full bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 overflow-hidden cursor-pointer"
                  whileHover={{ y: -8, scale: 1.03 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  {/* Gradient overlay on hover */}
                  <motion.div
                    className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                      feature.color === 'blue' ? 'bg-gradient-to-br from-blue-50/50 via-transparent to-transparent' :
                      feature.color === 'green' ? 'bg-gradient-to-br from-green-50/50 via-transparent to-transparent' :
                      feature.color === 'purple' ? 'bg-gradient-to-br from-purple-50/50 via-transparent to-transparent' :
                      'bg-gradient-to-br from-red-50/50 via-transparent to-transparent'
                    }`}
                    initial={false}
                  />

                  {/* Animated border glow */}
                  <motion.div
                    className={`absolute inset-0 rounded-2xl ${
                      feature.color === 'blue' ? 'bg-blue-500/20' :
                      feature.color === 'green' ? 'bg-green-500/20' :
                      feature.color === 'purple' ? 'bg-purple-500/20' :
                      'bg-red-500/20'
                    } opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500`}
                    initial={false}
                  />

                  {/* Corner decoration */}
                  <div className={`absolute top-0 right-0 w-20 h-20 opacity-0 group-hover:opacity-30 transition-opacity duration-500 ${
                    feature.color === 'blue' ? 'bg-blue-200' :
                    feature.color === 'green' ? 'bg-green-200' :
                    feature.color === 'purple' ? 'bg-purple-200' :
                    'bg-red-200'
                  } rounded-bl-full`} />

                  <div className="relative z-10 text-center">
                    {/* Icon Container */}
                    <motion.div
                      className={`inline-flex p-4 rounded-2xl mb-4 shadow-md ${
                        feature.color === 'blue' ? 'bg-gradient-to-br from-blue-100 to-blue-50' :
                        feature.color === 'green' ? 'bg-gradient-to-br from-green-100 to-green-50' :
                        feature.color === 'purple' ? 'bg-gradient-to-br from-purple-100 to-purple-50' :
                        'bg-gradient-to-br from-red-100 to-red-50'
                      }`}
                      whileHover={{ scale: 1.1, rotate: [0, -5, 5, -5, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <feature.icon className={`text-4xl ${
                        feature.color === 'blue' ? 'text-blue-600' :
                        feature.color === 'green' ? 'text-green-600' :
                        feature.color === 'purple' ? 'text-purple-600' :
                        'text-red-600'
                      }`} />
                    </motion.div>

                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-[#11496c] transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed group-hover:text-slate-700 transition-colors duration-300">
                      {feature.description}
                    </p>

                    {/* Expanding accent line */}
                    <motion.div
                      className={`absolute bottom-0 left-0 right-0 h-1 ${
                        feature.color === 'blue' ? 'bg-blue-400' :
                        feature.color === 'green' ? 'bg-green-400' :
                        feature.color === 'purple' ? 'bg-purple-400' :
                        'bg-red-400'
                      }`}
                      initial={{ scaleX: 0 }}
                      whileHover={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                      style={{ transformOrigin: 'left' }}
                    />
                  </div>

                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                    initial={false}
                  />
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        className="py-20 md:py-32 text-white relative overflow-hidden"
        style={{
          background: 'linear-gradient(to right, #11496c, #0d3a54)',
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6 }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6"
            >
              Ready to Get Started?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-white/90 mb-8 max-w-2xl mx-auto"
            >
              Join thousands of users who are taking control of their health with Heallyn.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <button
                onClick={() => navigate('/onboarding')}
                className="w-full sm:w-auto px-8 py-4 bg-white text-[#11496c] rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                <span>Sign Up Now</span>
                <IoArrowForwardOutline className="text-xl" />
              </button>
              <button
                onClick={() => scrollToSection('#contact')}
                className="w-full sm:w-auto px-8 py-4 bg-transparent text-white rounded-xl text-lg font-semibold border-2 border-white hover:bg-white/10 transition-all duration-300"
              >
                Contact Us
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section
        id="contact"
        className="py-20 md:py-32 bg-slate-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Get in Touch
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Have questions? We're here to help. Reach out to us anytime.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: IoCallOutline,
                title: 'Phone',
                content: '+91 1234567890',
                link: 'tel:+911234567890',
                color: 'blue',
              },
              {
                icon: IoMailOutline,
                title: 'Email',
                content: 'support@heallyn.com',
                link: 'mailto:support@heallyn.com',
                color: 'green',
              },
              {
                icon: IoLogoWhatsapp,
                title: 'WhatsApp',
                content: '+91 1234567890',
                link: 'https://wa.me/911234567890',
                color: 'green',
              },
            ].map((contact, index) => (
              <motion.a
                key={contact.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                href={contact.link}
                target={contact.link.startsWith('http') ? '_blank' : undefined}
                rel={contact.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 text-center"
              >
                <contact.icon className={`text-4xl mx-auto mb-4 ${
                  contact.color === 'blue' ? 'text-blue-600' :
                  'text-green-600'
                }`} />
                <h3 className="text-xl font-bold text-slate-900 mb-2">{contact.title}</h3>
                <p className="text-slate-600">{contact.content}</p>
              </motion.a>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <WebFooter />
    </div>
  )
}

export default Home

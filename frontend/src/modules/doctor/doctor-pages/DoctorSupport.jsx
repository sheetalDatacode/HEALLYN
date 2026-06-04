import { createSupportTicket, getSupportTickets, getSupportHistory } from '../doctor-services/doctorService'
import SupportPage from '../../../components/legal/SupportPage'

const DoctorSupport = () => {
  return (
    <SupportPage 
      createSupportTicket={createSupportTicket}
      getSupportTickets={getSupportTickets}
      getSupportHistory={getSupportHistory}
      orgFieldLabel="Clinic Name"
      roleName="healthcare professional"
    />
  )
}

export default DoctorSupport

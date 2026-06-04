import { createSupportTicket, getSupportTickets, getSupportHistory } from '../nurse-services/nurseService'
import SupportPage from '../../../components/legal/SupportPage'

const NurseSupport = () => {
  return (
    <SupportPage 
      createSupportTicket={createSupportTicket}
      getSupportTickets={getSupportTickets}
      getSupportHistory={getSupportHistory}
      orgFieldLabel="Organization Name"
      roleName="nurse"
    />
  )
}

export default NurseSupport

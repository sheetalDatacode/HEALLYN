import { createSupportTicket, getSupportTickets, getSupportHistory } from '../laboratory-services/laboratoryService'
import SupportPage from '../../../components/legal/SupportPage'

const LaboratorySupport = () => {
  return (
    <SupportPage 
      createSupportTicket={createSupportTicket}
      getSupportTickets={getSupportTickets}
      getSupportHistory={getSupportHistory}
      orgFieldLabel="Laboratory Name"
      roleName="laboratory"
    />
  )
}

export default LaboratorySupport

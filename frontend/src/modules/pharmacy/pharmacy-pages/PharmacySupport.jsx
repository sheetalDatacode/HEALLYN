import { createSupportTicket, getSupportTickets, getSupportHistory } from '../pharmacy-services/pharmacyService'
import SupportPage from '../../../components/legal/SupportPage'

const PharmacySupport = () => {
  return (
    <SupportPage 
      createSupportTicket={createSupportTicket}
      getSupportTickets={getSupportTickets}
      getSupportHistory={getSupportHistory}
      orgFieldLabel="Pharmacy Name"
      roleName="pharmacy"
    />
  )
}

export default PharmacySupport

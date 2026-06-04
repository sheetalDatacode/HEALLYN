import WalletDashboard from '../../../components/wallet/WalletDashboard'
import { getLaboratoryWalletBalance } from '../laboratory-services/laboratoryService'

const LaboratoryWallet = () => {
  return (
    <WalletDashboard 
      fetchBalance={getLaboratoryWalletBalance} 
      baseRoute="/laboratory/wallet" 
    />
  )
}

export default LaboratoryWallet

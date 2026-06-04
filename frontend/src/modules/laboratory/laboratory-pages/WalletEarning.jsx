import WalletEarning from '../../../components/wallet/WalletEarning'
import { getLaboratoryWalletEarnings } from '../laboratory-services/laboratoryService'

const LaboratoryWalletEarning = () => {
  return (
    <WalletEarning 
      fetchEarnings={getLaboratoryWalletEarnings} 
      baseRoute="/laboratory/wallet" 
    />
  )
}

export default LaboratoryWalletEarning

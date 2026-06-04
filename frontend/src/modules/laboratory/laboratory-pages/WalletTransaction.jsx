import WalletTransaction from '../../../components/wallet/WalletTransaction'
import { getLaboratoryWalletTransactions } from '../laboratory-services/laboratoryService'

const LaboratoryWalletTransaction = () => {
  return (
    <WalletTransaction 
      fetchTransactions={getLaboratoryWalletTransactions} 
      baseRoute="/laboratory/wallet" 
    />
  )
}

export default LaboratoryWalletTransaction

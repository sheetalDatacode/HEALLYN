import WalletBalance from '../../../components/wallet/WalletBalance'
import { getLaboratoryWalletBalance, getLaboratoryWalletTransactions } from '../laboratory-services/laboratoryService'

const LaboratoryWalletBalance = () => {
  return (
    <WalletBalance 
      fetchBalance={getLaboratoryWalletBalance} 
      fetchTransactions={getLaboratoryWalletTransactions} 
      baseRoute="/laboratory/wallet" 
    />
  )
}

export default LaboratoryWalletBalance

import WalletTransaction from '../../../components/wallet/WalletTransaction'
import { getNurseWalletTransactions } from '../nurse-services/nurseService'

const NurseWalletTransaction = () => {
  return (
    <WalletTransaction 
      fetchTransactions={getNurseWalletTransactions} 
      baseRoute="/nurse/wallet" 
    />
  )
}

export default NurseWalletTransaction

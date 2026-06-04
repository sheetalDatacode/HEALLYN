import WalletBalance from '../../../components/wallet/WalletBalance'
import { getNurseWalletBalance, getNurseWalletTransactions } from '../nurse-services/nurseService'

const NurseWalletBalance = () => {
  return (
    <WalletBalance 
      fetchBalance={getNurseWalletBalance} 
      fetchTransactions={getNurseWalletTransactions} 
      baseRoute="/nurse/wallet" 
    />
  )
}

export default NurseWalletBalance

import WalletTransaction from '../../../components/wallet/WalletTransaction'
import { getPharmacyWalletTransactions } from '../pharmacy-services/pharmacyService'

const PharmacyWalletTransaction = () => {
  return (
    <WalletTransaction 
      fetchTransactions={getPharmacyWalletTransactions} 
      baseRoute="/pharmacy/wallet" 
    />
  )
}

export default PharmacyWalletTransaction

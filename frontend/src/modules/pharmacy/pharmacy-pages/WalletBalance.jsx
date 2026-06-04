import WalletBalance from '../../../components/wallet/WalletBalance'
import { getPharmacyWalletBalance, getPharmacyWalletTransactions } from '../pharmacy-services/pharmacyService'

const PharmacyWalletBalance = () => {
  return (
    <WalletBalance 
      fetchBalance={getPharmacyWalletBalance} 
      fetchTransactions={getPharmacyWalletTransactions} 
      baseRoute="/pharmacy/wallet" 
    />
  )
}

export default PharmacyWalletBalance

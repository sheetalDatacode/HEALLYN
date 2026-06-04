import WalletDashboard from '../../../components/wallet/WalletDashboard'
import { getPharmacyWalletBalance } from '../pharmacy-services/pharmacyService'

const PharmacyWallet = () => {
  return (
    <WalletDashboard 
      fetchBalance={getPharmacyWalletBalance} 
      baseRoute="/pharmacy/wallet" 
    />
  )
}

export default PharmacyWallet

import WalletEarning from '../../../components/wallet/WalletEarning'
import { getPharmacyWalletEarnings } from '../pharmacy-services/pharmacyService'

const PharmacyWalletEarning = () => {
  return (
    <WalletEarning 
      fetchEarnings={getPharmacyWalletEarnings} 
      baseRoute="/pharmacy/wallet" 
    />
  )
}

export default PharmacyWalletEarning

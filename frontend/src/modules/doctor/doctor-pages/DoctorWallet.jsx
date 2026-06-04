import WalletDashboard from '../../../components/wallet/WalletDashboard'
import { getDoctorWalletBalance } from '../doctor-services/doctorService'

const DoctorWallet = () => {
  return (
    <WalletDashboard 
      fetchBalance={getDoctorWalletBalance} 
      baseRoute="/doctor/wallet" 
    />
  )
}

export default DoctorWallet

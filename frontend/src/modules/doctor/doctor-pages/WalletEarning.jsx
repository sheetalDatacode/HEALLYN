import WalletEarning from '../../../components/wallet/WalletEarning'
import { getDoctorWalletEarnings } from '../doctor-services/doctorService'

const DoctorWalletEarning = () => {
  return (
    <WalletEarning 
      fetchEarnings={getDoctorWalletEarnings} 
      baseRoute="/doctor/wallet" 
    />
  )
}

export default DoctorWalletEarning

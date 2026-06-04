import WalletBalance from '../../../components/wallet/WalletBalance'
import { getDoctorWalletBalance, getDoctorWalletTransactions } from '../doctor-services/doctorService'

const DoctorWalletBalance = () => {
  return (
    <WalletBalance 
      fetchBalance={getDoctorWalletBalance} 
      fetchTransactions={getDoctorWalletTransactions} 
      baseRoute="/doctor/wallet" 
    />
  )
}

export default DoctorWalletBalance

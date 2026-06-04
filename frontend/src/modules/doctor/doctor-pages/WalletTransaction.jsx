import WalletTransaction from '../../../components/wallet/WalletTransaction'
import { getDoctorWalletTransactions } from '../doctor-services/doctorService'

const DoctorWalletTransaction = () => {
  return (
    <WalletTransaction 
      fetchTransactions={getDoctorWalletTransactions} 
      baseRoute="/doctor/wallet" 
    />
  )
}

export default DoctorWalletTransaction

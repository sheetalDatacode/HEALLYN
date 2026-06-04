import WalletWithdraw from '../../../components/wallet/WalletWithdraw'
import { getDoctorWalletBalance, getDoctorWithdrawals, requestWithdrawal } from '../doctor-services/doctorService'

const DoctorWalletWithdraw = () => {
  return (
    <WalletWithdraw 
      fetchBalance={getDoctorWalletBalance} 
      fetchWithdrawals={getDoctorWithdrawals} 
      requestWithdrawal={requestWithdrawal}
      baseRoute="/doctor/wallet" 
    />
  )
}

export default DoctorWalletWithdraw

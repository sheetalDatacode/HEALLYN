import WalletWithdraw from '../../../components/wallet/WalletWithdraw'
import { getNurseWalletBalance, getNurseWithdrawalHistory, requestNurseWithdrawal } from '../nurse-services/nurseService'

const NurseWalletWithdraw = () => {
  return (
    <WalletWithdraw 
      fetchBalance={getNurseWalletBalance} 
      fetchWithdrawals={getNurseWithdrawalHistory} 
      requestWithdrawal={requestNurseWithdrawal}
      baseRoute="/nurse/wallet" 
    />
  )
}

export default NurseWalletWithdraw

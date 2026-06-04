import WalletWithdraw from '../../../components/wallet/WalletWithdraw'
import { getLaboratoryWalletBalance, getLaboratoryWithdrawals, requestLaboratoryWithdrawal } from '../laboratory-services/laboratoryService'

const LaboratoryWalletWithdraw = () => {
  return (
    <WalletWithdraw 
      fetchBalance={getLaboratoryWalletBalance} 
      fetchWithdrawals={getLaboratoryWithdrawals} 
      requestWithdrawal={requestLaboratoryWithdrawal}
      baseRoute="/laboratory/wallet" 
    />
  )
}

export default LaboratoryWalletWithdraw

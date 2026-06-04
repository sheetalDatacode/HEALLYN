import WalletDashboard from '../../../components/wallet/WalletDashboard'
import { getNurseWalletBalance } from '../nurse-services/nurseService'

const NurseWallet = () => {
  return (
    <WalletDashboard 
      fetchBalance={getNurseWalletBalance} 
      baseRoute="/nurse/wallet" 
    />
  )
}

export default NurseWallet

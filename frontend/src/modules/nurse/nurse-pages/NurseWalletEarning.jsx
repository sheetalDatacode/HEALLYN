import WalletEarning from '../../../components/wallet/WalletEarning'
import { getNurseWalletEarnings } from '../nurse-services/nurseService'

const NurseWalletEarning = () => {
  return (
    <WalletEarning 
      fetchEarnings={getNurseWalletEarnings} 
      baseRoute="/nurse/wallet" 
    />
  )
}

export default NurseWalletEarning

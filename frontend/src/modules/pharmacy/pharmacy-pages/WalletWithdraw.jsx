import WalletWithdraw from '../../../components/wallet/WalletWithdraw'
import { getPharmacyWalletBalance, getPharmacyWithdrawals } from '../pharmacy-services/pharmacyService'
import { ApiClient } from '../../../utils/apiClient'

// Note: requestPharmacyWithdrawal isn't explicitly defined in pharmacyService, but we can call it using apiClient directly
// or just define a local wrapper. We'll define a local wrapper to keep the prop interface the same.
const apiClient = new ApiClient('pharmacy')
const requestPharmacyWithdrawal = async (withdrawalData) => {
  try {
    return await apiClient.post('/pharmacy/wallet/withdraw', withdrawalData)
  } catch (error) {
    console.error('Error requesting withdrawal:', error)
    throw error
  }
}

const PharmacyWalletWithdraw = () => {
  return (
    <WalletWithdraw 
      fetchBalance={getPharmacyWalletBalance} 
      fetchWithdrawals={getPharmacyWithdrawals} 
      requestWithdrawal={requestPharmacyWithdrawal}
      baseRoute="/pharmacy/wallet" 
    />
  )
}

export default PharmacyWalletWithdraw

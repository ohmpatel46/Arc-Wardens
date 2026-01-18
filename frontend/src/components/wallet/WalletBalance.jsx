export default function WalletBalance({ walletBalance, walletInfo, isLoading, onRequestFaucet }) {
  if (!walletBalance) return null

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Balance</h3>
      {walletBalance.usdcBalance ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">USDC</span>
            <span className="text-2xl font-bold text-gray-900">
              {walletBalance.usdcBalance.amount || '0'}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Token: {walletBalance.usdcBalance.token?.symbol || 'USDC'}
          </div>
        </div>
      ) : (
        <div className="text-gray-500">No USDC balance found</div>
      )}
      {walletInfo && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <div className="mb-1">Address: <span className="font-mono text-xs">{walletInfo.address}</span></div>
            <div>Blockchain: {walletInfo.blockchain || 'ARC-TESTNET'}</div>
          </div>
          <button
            onClick={onRequestFaucet}
            disabled={isLoading}
            className="mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition disabled:opacity-50"
          >
            Request Test USDC
          </button>
        </div>
      )}
    </div>
  )
}

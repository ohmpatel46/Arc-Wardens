export default function TransactionList({ 
  transactions, 
  currentWalletAddress, 
  isLoading, 
  onRefresh 
}) {
  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Loading transactions...</div>
  }

  if (transactions.length === 0) {
    return <div className="text-center py-8 text-gray-500">No transactions found</div>
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
        >
          Refresh
        </button>
      </div>
      <div className="space-y-3">
        {transactions.map((tx, index) => {
          // Check if From or To address matches current wallet address
          const fromAddress = tx.sourceAddress?.toLowerCase() || ''
          const toAddress = tx.destinationAddress?.toLowerCase() || ''
          const isFromYou = currentWalletAddress && fromAddress === currentWalletAddress
          const isToYou = currentWalletAddress && toAddress === currentWalletAddress
          
          // Determine transaction type (sent or received)
          const txType = isFromYou ? 'sent' : isToYou ? 'received' : 'unknown'
          
          return (
            <div
              key={tx.id || index}
              className={`border rounded-md p-4 transition ${
                txType === 'sent' 
                  ? 'border-red-200 bg-red-50/30 hover:bg-red-50/50' 
                  : txType === 'received'
                  ? 'border-green-200 bg-green-50/30 hover:bg-green-50/50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {tx.type || 'Transaction'}
                  </span>
                  {txType === 'sent' && (
                    <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 font-medium">
                      Sent
                    </span>
                  )}
                  {txType === 'received' && (
                    <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 font-medium">
                      Received
                    </span>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  tx.state === 'COMPLETE' ? 'bg-green-100 text-green-700' :
                  tx.state === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                  tx.state === 'FAILED' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {tx.state || 'UNKNOWN'}
                </span>
              </div>
              {tx.id && (
                <div className="text-xs text-gray-500 font-mono mb-1">
                  ID: {tx.id}
                </div>
              )}
              {tx.sourceAddress && (
                <div className="text-xs text-gray-600">
                  From: <span className="font-mono">{tx.sourceAddress}</span>
                  {isFromYou && (
                    <span className="ml-2 text-blue-600 font-medium">(you)</span>
                  )}
                </div>
              )}
              {tx.destinationAddress && (
                <div className="text-xs text-gray-600">
                  To: <span className="font-mono">{tx.destinationAddress}</span>
                  {isToYou && (
                    <span className="ml-2 text-blue-600 font-medium">(you)</span>
                  )}
                </div>
              )}
              {tx.amounts && tx.amounts.length > 0 && (
                <div className="text-sm text-gray-700 mt-2">
                  Amount: {tx.amounts.join(', ')}
                </div>
              )}
              {tx.createdAt && (
                <div className="text-xs text-gray-500 mt-2">
                  {new Date(tx.createdAt).toLocaleString()}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

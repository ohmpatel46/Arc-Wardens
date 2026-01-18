import MessageBanner from '../shared/MessageBanner'

export default function SendTransaction({ 
  sendAmount,
  sendAddress,
  sendTokenId,
  isSending,
  successMessage,
  errorMessage,
  onAmountChange,
  onAddressChange,
  onTokenIdChange,
  onSend
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Transaction</h3>
      
      <MessageBanner successMessage={successMessage} errorMessage={errorMessage} />
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Receiver Address
          </label>
          <input
            type="text"
            value={sendAddress}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="0x..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount
          </label>
          <input
            type="text"
            value={sendAmount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="1.0"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Token ID
          </label>
          <input
            type="text"
            value={sendTokenId}
            onChange={(e) => onTokenIdChange(e.target.value)}
            placeholder="Enter token ID"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          onClick={onSend}
          disabled={!sendAmount || !sendAddress || !sendTokenId || isSending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? 'Sending...' : 'Send Transaction'}
        </button>
      </div>
    </div>
  )
}

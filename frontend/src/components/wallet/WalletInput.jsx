export default function WalletInput({ walletId, isLoading, onWalletIdChange, onLoad }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Wallet ID
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={walletId}
          onChange={(e) => onWalletIdChange(e.target.value)}
          placeholder="Enter your Circle wallet ID"
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={onLoad}
          disabled={!walletId || isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Loading...' : 'Load'}
        </button>
      </div>
    </div>
  )
}

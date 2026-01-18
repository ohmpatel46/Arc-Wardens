export default function PaymentModal({ 
  isOpen, 
  campaignCost, 
  isLoading, 
  onClose, 
  onPay 
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 border border-gray-200 shadow-xl">
        <h3 className="text-xl font-semibold mb-4 text-gray-900">Payment Required</h3>
        <p className="text-gray-700 mb-4">
          To create this campaign, you need to pay <span className="font-bold text-amber-600">${campaignCost}</span>
        </p>
        <p className="text-sm text-gray-500 mb-6">
          This payment is required before the campaign can be created and activated.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded-md transition border border-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onPay}
            disabled={isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-md transition disabled:opacity-50 shadow-sm"
          >
            {isLoading ? 'Processing...' : 'Pay & Create Campaign'}
          </button>
        </div>
      </div>
    </div>
  )
}

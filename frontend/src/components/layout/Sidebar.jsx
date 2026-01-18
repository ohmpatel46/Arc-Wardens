import CampaignList from '../campaigns/CampaignList'

export default function Sidebar({
  campaigns,
  activeCampaignId,
  showWallet,
  showAnalytics,
  editingCampaignId,
  editingName,
  onCreateCampaign,
  onCampaignClick,
  onEditStart,
  onEditSave,
  onEditCancel,
  onDelete,
  onNameChange,
  onWalletToggle,
  onAnalyticsToggle
}) {
  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onCreateCampaign}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-md transition shadow-sm"
        >
          + New Campaign
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <CampaignList
          campaigns={campaigns}
          activeCampaignId={activeCampaignId}
          editingCampaignId={editingCampaignId}
          editingName={editingName}
          onCampaignClick={onCampaignClick}
          onEditStart={onEditStart}
          onEditSave={onEditSave}
          onEditCancel={onEditCancel}
          onDelete={onDelete}
          onNameChange={onNameChange}
        />
      </div>
      
      {/* Bottom Navigation Section */}
      <div className="border-t border-gray-200 p-4 bg-white space-y-2">
        <button
          onClick={onAnalyticsToggle}
          className={`w-full flex items-center gap-2 p-3 rounded-md transition ${
            showAnalytics
              ? 'bg-blue-700 text-white'
              : 'hover:bg-gray-100 border border-transparent text-gray-700'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="font-semibold text-sm">Campaign Analytics</span>
        </button>
        
        <button
          onClick={onWalletToggle}
          className={`w-full flex items-center gap-2 p-3 rounded-md transition ${
            showWallet
              ? 'bg-blue-700 text-white'
              : 'hover:bg-gray-100 border border-transparent text-gray-700'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <span className="font-semibold text-sm">Your Wallet</span>
        </button>
      </div>
    </div>
  )
}

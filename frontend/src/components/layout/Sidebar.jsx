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
  onAnalyticsToggle,
  onLogout
}) {
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col font-[Inter] h-full shadow-sm z-20">
      {/* Brand Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-200">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">Arc Wardens</h1>
        </div>

        <button
          onClick={onCreateCampaign}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5 px-4 rounded-lg transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 group border border-transparent"
        >
          <svg className="w-4 h-4 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Campaign
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-1 py-4 scrollbar-hide">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Campaigns</div>
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
          theme="light"
        />
      </div>

      {/* Bottom Navigation Section */}
      <div className="p-3 bg-gray-50/50 space-y-1 border-t border-gray-200">
        <button
          onClick={onAnalyticsToggle}
          className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 group ${showAnalytics
            ? 'bg-white text-blue-600 shadow-sm border border-gray-200 font-semibold'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium'
            }`}
        >
          <svg className={`w-5 h-5 ${showAnalytics ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-sm">Analytics</span>
        </button>

        <button
          onClick={onWalletToggle}
          className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 group ${showWallet
            ? 'bg-white text-blue-600 shadow-sm border border-gray-200 font-semibold'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium'
            }`}
        >
          <svg className={`w-5 h-5 ${showWallet ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <span className="text-sm">Wallet</span>
        </button>

        <div className="pt-2 mt-2 border-t border-gray-200/50">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 text-gray-500 hover:text-red-600 hover:bg-red-50 group"
          >
            <svg className="w-5 h-5 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  )
}

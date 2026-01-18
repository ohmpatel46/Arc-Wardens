import CampaignList from '../campaigns/CampaignList'

export default function Sidebar({
  campaigns,
  activeCampaignId,
  showWallet,
  editingCampaignId,
  editingName,
  onCreateCampaign,
  onCampaignClick,
  onEditStart,
  onEditSave,
  onEditCancel,
  onDelete,
  onNameChange,
  onWalletToggle
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
      
      {/* Your Wallet Section - Docked at Bottom */}
      <div className="border-t border-gray-200 p-4 bg-white">
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

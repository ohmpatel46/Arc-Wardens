export default function CampaignList({ 
  campaigns, 
  activeCampaignId, 
  editingCampaignId,
  editingName,
  onCampaignClick,
  onEditStart,
  onEditSave,
  onEditCancel,
  onDelete,
  onNameChange
}) {
  if (campaigns.length === 0) {
    return (
      <div className="p-4 text-gray-500 text-sm text-center">
        No campaigns yet. Create one to get started!
      </div>
    )
  }

  return (
    <div className="p-2">
      {campaigns.map((campaign) => (
        <div
          key={campaign.id}
          className={`group relative mb-1 rounded-md p-3 cursor-pointer transition ${
            activeCampaignId === campaign.id
              ? 'bg-blue-50 border border-blue-200'
              : 'hover:bg-gray-100 border border-transparent'
          }`}
          onClick={() => onCampaignClick(campaign.id)}
        >
          {editingCampaignId === campaign.id ? (
            <input
              type="text"
              value={editingName}
              onChange={(e) => onNameChange(e.target.value)}
              onBlur={() => onEditSave(campaign.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onEditSave(campaign.id)
                else if (e.key === 'Escape') onEditCancel()
              }}
              className="w-full bg-white border border-gray-300 text-gray-900 px-2 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className={`text-sm font-medium truncate ${
                  activeCampaignId === campaign.id ? 'text-blue-700' : 'text-gray-900'
                }`}>
                  {campaign.name}
                </span>
                <span className={`text-xs ${campaign.paid ? 'text-green-500' : 'text-amber-500'}`}>
                  {campaign.paid ? '✓' : '●'}
                </span>
              </div>
              <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                {!campaign.paid && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onEditStart(campaign.id, campaign.name)
                    }}
                    className="text-gray-400 hover:text-gray-700 p-1.5 rounded hover:bg-gray-200 transition"
                    title="Rename"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(campaign.id)
                  }}
                  className="text-gray-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition"
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

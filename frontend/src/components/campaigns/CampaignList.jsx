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
      <div className="p-4 text-gray-400 text-xs text-center font-medium">
        No campaigns yet.
        <br />
        <span className="opacity-75">Create one above to get started.</span>
      </div>
    )
  }

  return (
    <div className="space-y-0.5">
      {campaigns.map((campaign) => (
        <div
          key={campaign.id}
          className={`group relative rounded-lg px-3 py-2.5 cursor-pointer transition-all duration-200 border border-transparent ${activeCampaignId === campaign.id
              ? 'bg-blue-50 text-blue-700 font-medium shadow-sm border-blue-100'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
              className="w-full bg-white border border-blue-300 text-gray-900 px-2 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className={`w-2 h-2 rounded-full ring-2 ring-white ${campaign.paid ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                <span className="text-sm truncate leading-none pt-0.5">
                  {campaign.name}
                </span>
              </div>
              <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity items-center">
                {!campaign.paid && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onEditStart(campaign.id, campaign.name)
                    }}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-200/50 transition"
                    title="Rename"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(campaign.id)
                  }}
                  className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition"
                  title="Delete"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

const formatNumber = (num) => (num || 0).toLocaleString()
const calculateRate = (numerator, denominator) => 
  denominator ? ((numerator / denominator) * 100).toFixed(1) : '0'

export default function CampaignAnalytics({ campaign, analytics = {} }) {
  return (
    <>
      <div className="p-4 bg-white shadow-sm border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">{campaign?.name}</h2>
        <p className="text-sm text-gray-500 mt-1">Campaign Analytics</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="text-sm text-gray-600 mb-1">Emails Sent</div>
              <div className="text-3xl font-bold text-gray-900">{formatNumber(analytics.emailsSent)}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="text-sm text-gray-600 mb-1">Emails Opened</div>
              <div className="text-3xl font-bold text-gray-900">{formatNumber(analytics.emailsOpened)}</div>
              <div className="text-xs text-gray-500 mt-1">
                {calculateRate(analytics.emailsOpened, analytics.emailsSent)}% open rate
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="text-sm text-gray-600 mb-1">Replies</div>
              <div className="text-3xl font-bold text-gray-900">{formatNumber(analytics.replies)}</div>
              <div className="text-xs text-gray-500 mt-1">
                {calculateRate(analytics.replies, analytics.emailsOpened)}% reply rate
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="text-sm text-gray-600 mb-1">Bounce Rate</div>
              <div className="text-3xl font-bold text-gray-900">{analytics.bounceRate?.toFixed(1) || 0}%</div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Performance</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Emails Sent</span>
                <span className="font-semibold text-gray-900">{formatNumber(analytics.emailsSent)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Successfully Delivered</span>
                <span className="font-semibold text-gray-900">
                  {formatNumber(analytics.emailsSent - Math.round(analytics.emailsSent * analytics.bounceRate / 100))}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Opened</span>
                <span className="font-semibold text-green-600">{formatNumber(analytics.emailsOpened)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Replied</span>
                <span className="font-semibold text-blue-600">{formatNumber(analytics.replies)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Bounced</span>
                <span className="font-semibold text-red-600">
                  {formatNumber(Math.round(analytics.emailsSent * analytics.bounceRate / 100))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

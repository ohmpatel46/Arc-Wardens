import { useState, useEffect } from 'react'
import axios from 'axios'
import CampaignAnalytics from './CampaignAnalytics'
import LoadingSpinner from '../shared/LoadingSpinner'
import { DEFAULT_ANALYTICS } from '../../App'

const API_BASE = '/api'

export default function CampaignAnalyticsView() {
  const [campaigns, setCampaigns] = useState([])
  const [selectedCampaignId, setSelectedCampaignId] = useState('')
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  useEffect(() => {
    if (selectedCampaignId) {
      fetchCampaignAnalytics(selectedCampaignId)
    } else {
      setSelectedCampaign(null)
    }
  }, [selectedCampaignId])

  const fetchCampaigns = async () => {
    setIsLoadingCampaigns(true)
    try {
      const response = await axios.get(`${API_BASE}/campaigns`)
      if (response.data.success) {
        // Filter only paid campaigns
        const allCampaigns = response.data.campaigns || []
        const paidCampaigns = allCampaigns.filter(c => c.paid)
        setCampaigns(paidCampaigns)

        // Auto-select first paid campaign if available
        if (paidCampaigns.length > 0) {
          setSelectedCampaignId(paidCampaigns[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setIsLoadingCampaigns(false)
    }
  }

  const fetchCampaignAnalytics = async (campaignId) => {
    setIsLoading(true)
    try {
      const response = await axios.get(`${API_BASE}/campaigns/${campaignId}/analytics`)
      if (response.data.success) {
        setSelectedCampaign(response.data.campaign)
      }
    } catch (error) {
      console.error('Error fetching campaign analytics:', error)
      setSelectedCampaign(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 bg-white shadow-sm border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Campaign Analytics</h2>
        <p className="text-sm text-gray-500 mt-1">View analytics for any campaign</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          {/* Campaign Selector */}
          <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Campaign
            </label>
            {isLoadingCampaigns ? (
              <div className="flex items-center gap-2 text-gray-500">
                <LoadingSpinner size="small" />
                <span className="text-sm">Loading campaigns...</span>
              </div>
            ) : (
              <select
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Select a campaign --</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name} {campaign.paid ? '✓' : ''} ({campaign.status})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Analytics Display */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <LoadingSpinner />
                <p className="mt-4 text-gray-500">Loading analytics...</p>
              </div>
            </div>
          ) : selectedCampaign ? (
            <CampaignAnalytics
              campaign={selectedCampaign}
              analytics={selectedCampaign.analytics || DEFAULT_ANALYTICS}
            />
          ) : selectedCampaignId ? (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-500">No analytics data available for this campaign.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-500">Please select a campaign to view analytics.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

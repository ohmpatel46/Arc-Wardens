import { useState, useEffect } from 'react'
import axios from 'axios'
import CampaignAnalytics from './CampaignAnalytics'
import LoadingSpinner from '../shared/LoadingSpinner'
import { DEFAULT_ANALYTICS } from '../../constants'
import { useAuth } from '../../context/AuthContext'

const API_BASE = '/api'

export default function CampaignAnalyticsView() {
  const { user } = useAuth()
  const [campaigns, setCampaigns] = useState([])
  const [selectedCampaignId, setSelectedCampaignId] = useState('')
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true)

  // Status checking state (lifted from CampaignAnalytics)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [replies, setReplies] = useState([])

  useEffect(() => {
    fetchCampaigns()
  }, [])

  useEffect(() => {
    if (selectedCampaignId) {
      fetchCampaignAnalytics(selectedCampaignId)
      setReplies([]) // Reset replies when campaign changes
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

  const checkStatus = async () => {
    if (!selectedCampaign?.id) return
    setCheckingStatus(true)
    try {
      const token = user?.token
      const googleToken = user?.access_token

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
      if (googleToken) {
        headers['X-Google-AccessToken'] = googleToken
      }

      const response = await axios.post(
        `${API_BASE}/campaigns/${selectedCampaign.id}/verify_status`,
        {},
        { headers }
      )

      if (response.data.success && response.data.data?.replies) {
        setReplies(response.data.data.replies)
      }
    } catch (e) {
      console.error("Failed to check status", e)
    } finally {
      setCheckingStatus(false)
    }
  }

  // If a campaign is selected and loaded, render the unified header and analytics view
  if (selectedCampaign && !isLoading) {
    return (
      <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden">
        {/* Unified Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-20 shadow-sm relative">
          <div className="flex items-center gap-4">
            {/* Custom Styled Campaign Selector */}
            <div className="group relative">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider absolute -top-1.5 left-0">Campaign</label>
              <select
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                className="appearance-none bg-transparent pt-3 pb-1 pr-8 text-xl font-bold text-gray-900 border-none focus:ring-0 focus:outline-none cursor-pointer tracking-tight hover:text-blue-600 transition-colors"
              >
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute bottom-2 right-0 flex items-center text-gray-900">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>

            {/* Status Indicator */}
            <div className="h-6 w-px bg-gray-200 mx-2"></div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-sm font-medium text-gray-500">Active</span>
            </div>
          </div>

          {/* Refresh Action */}
          <button
            onClick={checkStatus}
            disabled={checkingStatus}
            className={`
                relative inline-flex items-center px-4 py-2 border border-gray-200 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white
                transition-all duration-200 hover:bg-gray-50 hover:text-gray-900
                ${checkingStatus ? 'opacity-75 cursor-wait' : ''}
              `}
          >
            {checkingStatus ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Syncing...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-6 md:p-8">
          <CampaignAnalytics
            campaign={selectedCampaign}
            replies={replies}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 font-[Inter]">
      <div className="p-6 md:p-12 max-w-4xl mx-auto w-full flex-1 flex flex-col">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-3">Campaign Analytics</h2>
          <p className="text-gray-500 text-lg">Select a campaign to view detailed performance metrics and recipient status.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-lg mx-auto w-full">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Choose Campaign
          </label>
          {isLoadingCampaigns ? (
            <div className="flex items-center gap-3 text-gray-500 py-2">
              <LoadingSpinner size="small" />
              <span className="text-sm">Loading active campaigns...</span>
            </div>
          ) : (
            <div className="relative">
              <select
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-900 text-base rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full p-4 pr-10 hover:bg-white transition-colors cursor-pointer"
              >
                <option value="">Select a campaign...</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          )}

          {campaigns.length === 0 && !isLoadingCampaigns && (
            <p className="text-sm text-gray-500 mt-4 text-center bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200">
              No active paid campaigns found. Create one to see analytics!
            </p>
          )}

          {isLoading && (
            <div className="mt-8 flex justify-center">
              <LoadingSpinner />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

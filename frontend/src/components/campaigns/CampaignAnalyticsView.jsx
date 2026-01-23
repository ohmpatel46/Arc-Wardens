import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import CampaignAnalytics from './CampaignAnalytics'
import LoadingSpinner from '../shared/LoadingSpinner'
import { DEFAULT_ANALYTICS } from '../../constants'
import { useAuth } from '../../context/AuthContext'

const API_BASE = '/api'

// --- Helpers ---
const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return "just now";
}

const ReplyModal = ({ reply, onClose }) => {
  if (!reply) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md transition-all duration-300" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="bg-gray-50/50 border-b border-gray-100 p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              {reply.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{reply.email}</h3>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                {timeAgo(reply.receivedAt)}
                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                Via Email Campaign
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="prose prose-blue max-w-none">
            <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap font-[Inter]">
              {reply.response}
            </p>
          </div>
        </div>
        <div className="bg-gray-50 p-4 flex justify-end gap-3 border-t border-gray-100">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white hover:shadow-sm rounded-lg transition-all border border-transparent hover:border-gray-200" onClick={onClose}>
            Close
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-sm rounded-lg transition-all hover:shadow-md flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
            Reply Back
          </button>
        </div>
      </div>
    </div>
  );
}

const ReplyCard = ({ reply, onClick }) => {
  // Smart truncation logic
  const isLong = reply.response.length > 180;
  const previewText = isLong ? reply.response.substring(0, 180) + "..." : reply.response;

  return (
    <div
      onClick={() => onClick(reply)}
      className="group bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden h-full flex flex-col"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
            {reply.email?.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900 leading-none">{reply.email.split('@')[0]}</span>
            <span className="text-[10px] text-gray-400 mt-1">{timeAgo(reply.receivedAt)}</span>
          </div>
        </div>
      </div>

      <p className="text-gray-600 text-sm leading-relaxed font-[Inter]">
        {previewText}
      </p>

      <div className="mt-4 flex items-center justify-between">
        <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium bg-green-50 text-green-700 border border-green-100">
          Reply
        </span>

        {isLong && (
          <span className="text-xs font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            Read full
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </span>
        )}
      </div>
    </div>
  )
}

export default function CampaignAnalyticsView() {
  const { user } = useAuth()
  const [campaigns, setCampaigns] = useState([])
  const [selectedCampaignId, setSelectedCampaignId] = useState('')
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true)

  // Status checking state
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [replies, setReplies] = useState([])

  // UI State for Replies
  const [replySearch, setReplySearch] = useState('')
  const [selectedReply, setSelectedReply] = useState(null)
  const [visibleRepliesCount, setVisibleRepliesCount] = useState(6)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  useEffect(() => {
    if (selectedCampaignId) {
      fetchCampaignAnalytics(selectedCampaignId)
      setReplies([])
      setReplySearch('')
      setVisibleRepliesCount(6)
    } else {
      setSelectedCampaign(null)
    }
  }, [selectedCampaignId])

  useEffect(() => {
    if (selectedCampaign?.id) {
      checkStatus()
    }
  }, [selectedCampaign])

  const fetchCampaigns = async () => {
    setIsLoadingCampaigns(true)
    try {
      const response = await axios.get(`${API_BASE}/campaigns`)
      if (response.data.success) {
        const allCampaigns = response.data.campaigns || []
        const paidCampaigns = allCampaigns.filter(c => c.paid)
        setCampaigns(paidCampaigns)

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

  // Filter and pagination logic
  const filteredReplies = useMemo(() => {
    if (!replySearch) return replies;
    return replies.filter(r =>
      r.email?.toLowerCase().includes(replySearch.toLowerCase()) ||
      r.response?.toLowerCase().includes(replySearch.toLowerCase())
    );
  }, [replies, replySearch]);

  const visibleReplies = filteredReplies.slice(0, visibleRepliesCount);
  const hasMore = visibleRepliesCount < filteredReplies.length;

  if (selectedCampaign && !isLoading) {
    return (
      <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden">
        {/* Unified Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-20 shadow-sm relative">
          <div className="flex items-center gap-4">
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

            <div className="h-6 w-px bg-gray-200 mx-2"></div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-sm font-medium text-gray-500">Active</span>
            </div>
          </div>

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
        <div className="flex-1 overflow-auto p-6 md:p-8 space-y-8">

          {/* New Customer Responses Section */}
          {replies.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">Customer Responses</h3>
                  <p className="text-sm text-gray-500">Real-time feedback from your campaign recipients</p>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search replies..."
                    value={replySearch}
                    onChange={(e) => setReplySearch(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64 bg-white shadow-sm"
                  />
                  <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Smart Grid - Adapts to content quantity */}
              <div className={`grid gap-6 ${visibleReplies.length === 1 ? 'grid-cols-1 max-w-3xl mx-auto' :
                visibleReplies.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                  'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                }`}>
                {visibleReplies.map((reply, idx) => (
                  <div key={idx} className="h-full">
                    <ReplyCard reply={reply} onClick={setSelectedReply} />
                  </div>
                ))}
              </div>

              {/* Load More / Empty State */}
              {hasMore && (
                <div className="flex justify-center pt-8 pb-4">
                  <button
                    onClick={() => setVisibleRepliesCount(prev => prev + 6)}
                    className="px-8 py-3 bg-white border border-gray-200 shadow-sm rounded-full text-sm font-semibold text-gray-700 hover:text-gray-900 hover:shadow-md hover:border-gray-300 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    Load More Responses
                  </button>
                </div>
              )}

              {filteredReplies.length === 0 && (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <p className="text-gray-900 font-medium">No replies found matching "{replySearch}"</p>
                  <button onClick={() => setReplySearch('')} className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2">Clear search</button>
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[600px]">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Campaign Recipients</h3>
                <p className="text-sm text-gray-500 mt-1">Detailed status of every contact in this campaign</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {selectedCampaign?.contacts ? JSON.parse(selectedCampaign.contacts).length : 0} Contacts
                </span>
              </div>
            </div>
            <div className="flex-1 relative">
              <CampaignAnalytics
                campaign={selectedCampaign}
                replies={replies}
              />
            </div>
          </div>
        </div>

        {/* Detail Modal */}
        {selectedReply && <ReplyModal reply={selectedReply} onClose={() => setSelectedReply(null)} />}
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 font-[Inter]">
      <div className="p-6 md:p-8 w-full flex-1 flex flex-col">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
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

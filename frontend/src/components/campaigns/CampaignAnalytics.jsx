import { useMemo, useState } from 'react'

const TARGET_EMAILS = [
  "thevoiceprecis@gmail.com",
  "panopticnotes@gmail.com"
]

// Mock data generator for manual emails
const getMockData = (email) => {
  if (email.includes('voice')) {
    return {
      name: "Voice Precis",
      organization_name: "Voice AI Labs",
      title: "Founder",
      linkedin_url: "https://linkedin.com/in/voice-precis",
      city: "San Francisco",
      country: "USA"
    }
  }
  return {
    name: "Panoptic Notes",
    organization_name: "Panoptic Research",
    title: "Senior Analyst",
    linkedin_url: "https://linkedin.com/in/panoptic-notes",
    city: "New York",
    country: "USA"
  }
}

export default function CampaignAnalytics({ campaign, replies = [], userEmail }) {
  const [expandedEmail, setExpandedEmail] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')

  const recipients = useMemo(() => {
    let list = []
    // 1. Apollo Contacts (from DB)
    if (campaign?.contacts) {
      try {
        let parsed = typeof campaign.contacts === 'string' ? JSON.parse(campaign.contacts) : campaign.contacts
        if (typeof parsed === 'string') {
          try { parsed = JSON.parse(parsed) } catch (e) { }
        }
        if (Array.isArray(parsed)) list = parsed
      } catch (e) { console.error("Error parsing contacts", e) }
    }

    // 2. Manual Contacts
    TARGET_EMAILS.forEach(email => {
      if (!list.find(c => c.email === email)) {
        list.push({ email, ...getMockData(email), source: "Manual" })
      }
    })

    return list.filter(c => c.email && c.email.trim() !== '')
  }, [campaign])

  const getReply = (email) => {
    if (!email) return null;
    return replies.find(r => r.email && r.email.toLowerCase() === email.toLowerCase());
  }

  const filteredRecipients = useMemo(() => {
    return recipients.filter(contact => {
      const searchLower = search.toLowerCase()
      const matchesSearch = !search ||
        (contact.name?.toLowerCase().includes(searchLower)) ||
        (contact.email?.toLowerCase().includes(searchLower)) ||
        (contact.organization_name?.toLowerCase().includes(searchLower))

      const hasReply = !!getReply(contact.email)
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'replied' && hasReply) ||
        (statusFilter === 'sent' && !hasReply)

      const matchesRole = !roleFilter || contact.title?.toLowerCase().includes(roleFilter.toLowerCase())
      const locationString = `${contact.city || ''} ${contact.country || ''}`.toLowerCase()
      const matchesLocation = !locationFilter || locationString.includes(locationFilter.toLowerCase())

      return matchesSearch && matchesStatus && matchesRole && matchesLocation
    })
  }, [recipients, search, statusFilter, roleFilter, locationFilter, replies])

  const toggleExpand = (email) => {
    setExpandedEmail(prev => prev === email ? null : email);
  }

  const getStatus = (email) => {
    if (!email) return <span className="text-gray-300 font-normal">-</span>;
    const reply = getReply(email);
    if (reply) return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm ring-1 ring-indigo-500/10">
        <span className="relative flex h-2 w-2 mr-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
        </span>
        Replied
      </span>
    )
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-100/50 ring-1 ring-emerald-500/10">
        <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full mr-2"></span>
        Sent
      </span>
    )
  }

  const stats = useMemo(() => {
    const total = recipients.length
    const replied = recipients.filter(r => getReply(r.email)).length
    const rate = total > 0 ? Math.round((replied / total) * 100) : 0
    return { total, replied, rate }
  }, [recipients, replies])

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Premium Header Metrics */}
      <div className="flex-none px-1 pb-6 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Metric 1 */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-colors">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Recipients</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</p>
            </div>
            <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
          </div>
          {/* Metric 2 */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-colors">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Responses Received</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-slate-800 mt-1">{stats.replied}</p>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">+Now</span>
              </div>
            </div>
            <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
            </div>
          </div>
          {/* Metric 3 */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-colors">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Engagement Rate</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{stats.rate}%</p>
            </div>
            <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-white border border-gray-200 rounded-xl shadow-sm ring-1 ring-black/5 flex flex-col mx-1 mb-2">
        {/* Modern Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px] group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search recipients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all sm:text-sm"
            />
          </div>

          <div className="h-8 w-px bg-gray-200 mx-1 hidden sm:block"></div>

          {/* Custom Select Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none block w-40 pl-4 pr-10 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer font-medium"
            >
              <option value="all">All Status</option>
              <option value="sent">Sent</option>
              <option value="replied">Replied</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <input
            type="text"
            placeholder="Role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-32 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-gray-400"
          />

          <input
            type="text"
            placeholder="Location"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="w-32 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-gray-400"
          />
        </div>

        {/* Premium Table */}
        <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50 sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Recipient</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {filteredRecipients.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-24 text-center">
                    <div className="mx-auto h-24 w-24 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    </div>
                    <p className="text-gray-900 font-medium">No recipients found</p>
                    <p className="text-gray-500 text-sm mt-1">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                filteredRecipients.map((contact, idx) => {
                  const reply = getReply(contact.email);
                  const isExpanded = expandedEmail === contact.email;

                  return (
                    <>
                      <tr
                        key={idx}
                        onClick={() => reply && toggleExpand(contact.email)}
                        className={`group transition-all duration-200 border-l-4 ${reply ? 'cursor-pointer hover:bg-slate-50 border-l-transparent hover:border-l-blue-400' : 'hover:bg-gray-50 border-l-transparent'} ${isExpanded ? 'bg-slate-50 border-l-blue-500 shadow-inner' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className={`h-11 w-11 flex-shrink-0 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm transition-transform group-hover:scale-105 ${reply ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-slate-400 to-slate-500'}`}>
                              {contact.name ? contact.name.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{contact.name || 'Unknown'}</div>
                              <div className="text-xs text-gray-500 mt-0.5 font-mono">{contact.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatus(contact.email)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-700 font-medium">{contact.title || 'N/A'}</span>
                            <span className="text-xs text-gray-500">{contact.organization_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            {contact.city || contact.country ? `${contact.city || ''}, ${contact.country || ''}` : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            {contact.linkedin_url && (
                              <a
                                href={contact.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                title="View LinkedIn Profile"
                              >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                </svg>
                              </a>
                            )}
                            {reply ? (
                              <div className={`inline-flex p-2 rounded-full hover:bg-white hover:shadow-sm transition-all text-blue-500 ${isExpanded ? 'bg-white shadow-sm rotate-180' : ''}`}>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                              </div>
                            ) : (
                              !contact.linkedin_url && <span className="text-gray-300 text-xs">-</span>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Response Row */}
                      {isExpanded && reply && (
                        <tr key={`${idx}-detail`} className="bg-slate-50/50">
                          <td colSpan="5" className="px-0 py-0 border-b border-gray-100">
                            <div className="p-6 pl-20 pr-12 relative overflow-hidden">
                              <div className="absolute left-11 top-0 bottom-0 w-px border-l-2 border-dashed border-blue-200"></div>

                              <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden relative">
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                <div className="p-6">
                                  <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                      <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                      </span>
                                      Reply Content
                                    </h4>
                                    <span className="text-xs text-gray-400">{new Date(reply.receivedAt).toLocaleString()}</span>
                                  </div>

                                  <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap pl-8 border-l-2 border-gray-100">
                                    {reply.response}
                                  </div>

                                  <div className="mt-6 flex items-center gap-3 pl-8">
                                    <button
                                      onClick={() => window.open(`https://mail.google.com/mail/?authuser=${encodeURIComponent(userEmail || '')}#search/from%3A${encodeURIComponent(contact.email)}`, '_blank')}
                                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm shadow-blue-200 transition-all hover:-translate-y-0.5"
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                      Reply in Gmail
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50/50 px-6 py-3 border-t border-gray-100 flex justify-between items-center">
          <p className="text-xs text-gray-500">Showing {filteredRecipients.length} results</p>
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-400 opacity-20"></span>
            <span className="w-2 h-2 rounded-full bg-slate-400 opacity-20"></span>
            <span className="w-2 h-2 rounded-full bg-slate-400 opacity-20"></span>
          </div>
        </div>
      </div>
    </div>
  )
}

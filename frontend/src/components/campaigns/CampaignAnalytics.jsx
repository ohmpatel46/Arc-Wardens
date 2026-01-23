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

export default function CampaignAnalytics({ campaign, replies = [] }) {
  const [expandedEmail, setExpandedEmail] = useState(null)

  const recipients = useMemo(() => {
    let list = []

    // 1. Apollo Contacts (from DB)
    if (campaign?.contacts) {
      try {
        let parsed = typeof campaign.contacts === 'string' ? JSON.parse(campaign.contacts) : campaign.contacts
        // Handle double serialization if necessary
        if (typeof parsed === 'string') {
          try { parsed = JSON.parse(parsed) } catch (e) { }
        }
        if (Array.isArray(parsed)) {
          list = parsed
        }
      } catch (e) {
        console.error("Error parsing contacts", e)
      }
    }

    // 2. Manual Contacts (Merge in if not already present)
    TARGET_EMAILS.forEach(email => {
      if (!list.find(c => c.email === email)) {
        list.push({
          email,
          ...getMockData(email),
          source: "Manual"
        })
      }
    })

    return list
  }, [campaign])

  const getReply = (email) => {
    if (!email) return null;
    return replies.find(r => r.email && r.email.toLowerCase() === email.toLowerCase());
  }

  const toggleExpand = (email) => {
    if (expandedEmail === email) {
      setExpandedEmail(null);
    } else {
      setExpandedEmail(email);
    }
  }

  const getStatus = (email) => {
    if (!email) return <span className="text-gray-400">-</span>;
    const reply = getReply(email);
    if (reply) return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 shadow-sm">
        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5 animate-pulse"></span>
        Replied
      </span>
    )
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>
        Sent
      </span>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      <div className="flex-1 overflow-auto bg-white border border-gray-200 rounded-xl shadow-sm ring-1 ring-black/5">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left">
            <thead className="bg-gray-50/80 backdrop-blur-sm sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider font-[Inter]">Recipient</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider font-[Inter]">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider font-[Inter]">Role</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider font-[Inter]">Location</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider font-[Inter]">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recipients.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <p className="text-base font-medium text-gray-900">No recipients found</p>
                  </td>
                </tr>
              ) : (
                recipients.map((contact, idx) => {
                  const reply = getReply(contact.email);
                  const isExpanded = expandedEmail === contact.email;

                  return (
                    <>
                      <tr
                        key={idx}
                        onClick={() => reply && toggleExpand(contact.email)}
                        className={`group transition-all duration-200 ${reply ? 'cursor-pointer hover:bg-blue-50/30' : 'hover:bg-gray-50'} ${isExpanded ? 'bg-blue-50/50' : ''}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`h-10 w-10 flex-shrink-0 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm transition-transform group-hover:scale-105 ${reply ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'}`}>
                              {contact.name ? contact.name.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-gray-900">{contact.name || 'Unknown'}</div>
                              <div className="text-sm text-gray-500">{contact.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatus(contact.email)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">{contact.title || '-'}</div>
                          <div className="text-xs text-gray-500">{contact.organization_name || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{contact.city ? `${contact.city}, ${contact.country || ''}` : '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {reply ? (
                            <div className={`transition-transform duration-300 text-blue-500 ${isExpanded ? 'rotate-180' : ''}`}>
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                          ) : (
                            <span className="text-gray-300 text-xs">-</span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded Response Row */}
                      {isExpanded && reply && (
                        <tr key={`${idx}-detail`} className="bg-blue-50/30 animate-in fade-in slide-in-from-top-2 duration-200">
                          <td colSpan="5" className="px-0 py-0 border-b border-blue-100">
                            <div className="p-6 pl-20 pr-12 relative overflow-hidden">
                              <div className="absolute left-10 top-6 bottom-6 w-0.5 bg-blue-200 rounded-full"></div>

                              <div className="flex items-start justify-between gap-6">
                                <div className="flex-1">
                                  <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                    Internal Response
                                  </h4>
                                  <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm text-gray-800 text-sm leading-relaxed whitespace-pre-wrap font-[Inter]">
                                    {reply.response}
                                  </div>
                                  <div className="mt-2 text-xs text-gray-400 flex items-center gap-2">
                                    Received {new Date(reply.receivedAt).toLocaleString()}
                                  </div>
                                </div>

                                <div className="flex flex-col gap-3 pt-6 shrink-0">
                                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all hover:shadow-md active:scale-95">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                    Reply Back
                                  </button>
                                  <button
                                    onClick={() => toggleExpand(contact.email)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium rounded-lg shadow-sm transition-colors"
                                  >
                                    Close
                                  </button>
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
        {recipients.length > 0 && (
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">Showing {recipients.length} recipients. Click on rows with 'Replied' status to view user responses.</p>
          </div>
        )}
      </div>
    </div>
  )
}


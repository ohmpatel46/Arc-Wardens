import { useMemo } from 'react'

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

  const getStatus = (email) => {
    if (!email) return <span className="text-gray-400">-</span>;
    const reply = replies.find(r => r.email && r.email.toLowerCase() === email.toLowerCase())
    if (reply) return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
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
      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-auto bg-white border border-gray-200 rounded-xl shadow-sm ring-1 ring-black/5">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/80 backdrop-blur-sm sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider font-[Inter]">Recipient</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider font-[Inter]">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider font-[Inter]">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider font-[Inter]">Location</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider font-[Inter]">Source</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recipients.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <svg className="h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <p className="text-base font-medium text-gray-900">No recipients found</p>
                      <p className="text-sm mt-1">Add contacts to your campaign to see them here.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                recipients.map((contact, idx) => (
                  <tr key={idx} className="group hover:bg-gray-50/80 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold text-sm border border-indigo-200">
                          {contact.name ? contact.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{contact.name || 'Unknown'}</div>
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
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        {contact.city ? (
                          <>
                            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {contact.city}, {contact.country || ''}
                          </>
                        ) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contact.linkedin_url ? (
                        <a href={contact.linkedin_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-900 hover:underline flex items-center gap-1 font-medium">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                          LinkedIn
                        </a>
                      ) : 'Apollo.io'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {recipients.length > 0 && (
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">Showing {recipients.length} recipients. Status updates automatically.</p>
          </div>
        )}
      </div>
    </div>
  )
}

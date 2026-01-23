import { useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'

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

export default function CampaignAnalytics({ campaign, analytics = {} }) {
  const { user } = useAuth()
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [replies, setReplies] = useState([])

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

  const checkStatus = async () => {
    if (!campaign?.id) return
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

      const res = await fetch(`http://localhost:5001/api/campaigns/${campaign.id}/verify_status`, {
        method: 'POST',
        headers
      })
      const data = await res.json()
      if (data.success && data.data?.replies) {
        setReplies(data.data.replies) // List of {email, subject, Snippet}
      }
    } catch (e) {
      console.error("Failed to check status", e)
    } finally {
      setCheckingStatus(false)
    }
  }

  const getStatus = (email) => {
    const reply = replies.find(r => r.email.toLowerCase() === email.toLowerCase())
    if (reply) return <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">Replied</span>
    return <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">Sent</span>
  }

  return (
    <>
      <div className="p-4 bg-white shadow-sm border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{campaign?.name}</h2>
          <p className="text-sm text-gray-500 mt-1">Recipient Status Grid</p>
        </div>
        <button
          onClick={checkStatus}
          disabled={checkingStatus}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {checkingStatus ? 'Checking Inbox...' : 'Refresh Status'}
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recipients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No recipients found.
                  </td>
                </tr>
              ) : (
                recipients.map((contact, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{contact.name || 'Unknown'}</div>
                      {contact.linkedin_url && (
                        <a href={contact.linkedin_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:text-indigo-900">LinkedIn</a>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatus(contact.email)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contact.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contact.organization_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contact.title || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contact.city ? `${contact.city}, ${contact.country || ''}` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

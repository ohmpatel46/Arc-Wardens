import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

const API_BASE = '/api'

function App() {
  const [campaigns, setCampaigns] = useState([])
  const [activeCampaignId, setActiveCampaignId] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [campaignCost, setCampaignCost] = useState(null)
  const [editingCampaignId, setEditingCampaignId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  const activeCampaign = campaigns.find(c => c.id === activeCampaignId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    setMessages(activeCampaign?.messages || [])
  }, [activeCampaignId, activeCampaign])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage = { role: 'user', content: inputMessage }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInputMessage('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setIsLoading(true)

    try {
      const response = await axios.post(`${API_BASE}/chat`, {
        message: inputMessage,
        campaignId: activeCampaignId,
        conversationHistory: newMessages
      })

      const aiMessage = {
        role: 'assistant',
        content: response.data.message,
        campaignCost: response.data.campaignCost
      }

      const updatedMessages = [...newMessages, aiMessage]
      setMessages(updatedMessages)

      setCampaigns(campaigns.map(c => 
        c.id === activeCampaignId ? { ...c, messages: updatedMessages } : c
      ))

      if (response.data.campaignCost && !activeCampaign?.paid) {
        setCampaignCost(response.data.campaignCost)
        setIsPaymentModalOpen(true)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
    } finally {
      setIsLoading(false)
    }
  }

  const createNewCampaign = () => {
    const newCampaign = {
      id: Date.now().toString(),
      name: 'New Campaign',
      messages: [],
      paid: false
    }
    setCampaigns([newCampaign, ...campaigns])
    setActiveCampaignId(newCampaign.id)
    setMessages([])
  }

  const handlePayment = async () => {
    if (!activeCampaignId || !campaignCost) return

    setIsLoading(true)
    try {
      const response = await axios.post(`${API_BASE}/campaign/pay`, {
        campaignId: activeCampaignId,
        amount: campaignCost
      })

      if (response.data.success) {
        setCampaigns(campaigns.map(c => 
          c.id === activeCampaignId ? { ...c, paid: true } : c
        ))
        setIsPaymentModalOpen(false)
        setCampaignCost(null)

        const createResponse = await axios.post(`${API_BASE}/campaign/create`, {
          campaignId: activeCampaignId,
          messages: messages
        })

        if (createResponse.data.success) {
          alert('Campaign created successfully!')
        }
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Payment failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const saveCampaignName = (campaignId) => {
    if (editingName.trim()) {
      setCampaigns(campaigns.map(c => 
        c.id === campaignId ? { ...c, name: editingName.trim() } : c
      ))
    }
    setEditingCampaignId(null)
    setEditingName('')
  }

  const deleteCampaign = (campaignId) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      setCampaigns(campaigns.filter(c => c.id !== campaignId))
      if (activeCampaignId === campaignId) {
        setActiveCampaignId(null)
        setMessages([])
      }
    }
  }

  return (
    <div className="flex h-screen bg-white">
      <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={createNewCampaign}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-md transition shadow-sm"
          >
            + New Campaign
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {campaigns.length === 0 ? (
            <div className="p-4 text-gray-500 text-sm text-center">
              No campaigns yet. Create one to get started!
            </div>
          ) : (
            <div className="p-2">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className={`group relative mb-1 rounded-md p-3 cursor-pointer transition ${
                    activeCampaignId === campaign.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-100 border border-transparent'
                  }`}
                  onClick={() => setActiveCampaignId(campaign.id)}
                >
                  {editingCampaignId === campaign.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => saveCampaignName(campaign.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveCampaignName(campaign.id)
                        else if (e.key === 'Escape') {
                          setEditingCampaignId(null)
                          setEditingName('')
                        }
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
                        {!campaign.paid && <span className="text-xs text-amber-500">●</span>}
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingCampaignId(campaign.id)
                            setEditingName(campaign.name)
                          }}
                          className="text-gray-400 hover:text-gray-700 p-1.5 rounded hover:bg-gray-200 transition"
                          title="Rename"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteCampaign(campaign.id)
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
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {activeCampaignId ? (
          <>
            <div className="p-4 bg-white shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">
                {activeCampaign?.name}
                {!activeCampaign?.paid && (
                  <span className="ml-2 text-sm font-normal text-amber-600">(Payment Required)</span>
                )}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-4xl mx-auto w-full scrollbar-hide">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <p className="text-lg mb-2 text-gray-900">Start a conversation about your campaign</p>
                    <p className="text-sm">Describe your campaign, target audience, tone, and more</p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-2xl min-w-[200px] rounded-lg px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-900 shadow-sm'
                      }`}
                    >
                      <div className="whitespace-pre-wrap break-words">{message.content}</div>
                      {message.campaignCost && (
                        <div className="mt-2 pt-2 border-t border-gray-300">
                          <p className="text-sm font-semibold text-amber-600">
                            Campaign Cost: ${message.campaignCost}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            Payment required to create this campaign
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-200">
              <div className="max-w-2xl mx-auto">
                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => {
                    setInputMessage(e.target.value)
                    e.target.style.height = 'auto'
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder="Describe your campaign, target audience, email tone, aggressiveness level..."
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 min-h-[44px] max-h-[200px] overflow-y-auto shadow-sm"
                  rows={1}
                  disabled={isLoading}
                  style={{ height: 'auto' }}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-600">
              <p className="text-2xl mb-2 text-gray-900 font-semibold">Welcome to Arc Wardens</p>
              <p className="text-lg mb-6">AI-Powered Sales Outreach Automation</p>
              <button
                onClick={createNewCampaign}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md transition shadow-sm"
              >
                Create Your First Campaign
              </button>
            </div>
          </div>
        )}
      </div>

      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 border border-gray-200 shadow-xl">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Payment Required</h3>
            <p className="text-gray-700 mb-4">
              To create this campaign, you need to pay <span className="font-bold text-amber-600">${campaignCost}</span>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              This payment is required before the campaign can be created and activated.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsPaymentModalOpen(false)
                  setCampaignCost(null)
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded-md transition border border-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-md transition disabled:opacity-50 shadow-sm"
              >
                {isLoading ? 'Processing...' : 'Pay & Create Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App

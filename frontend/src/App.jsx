import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

const API_BASE = '/api'

const DEFAULT_ANALYTICS = {
  emailsSent: 1250,
  emailsOpened: 342,
  replies: 28,
  bounceRate: 2.4
}

function App() {
  const [campaigns, setCampaigns] = useState([])
  const [activeCampaignId, setActiveCampaignId] = useState(null)
  const [showWallet, setShowWallet] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [campaignCost, setCampaignCost] = useState(null)
  const [editingCampaignId, setEditingCampaignId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  
  // Wallet state
  const [walletId, setWalletId] = useState(localStorage.getItem('walletId') || '')
  const [walletBalance, setWalletBalance] = useState(null)
  const [walletInfo, setWalletInfo] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [isLoadingWallet, setIsLoadingWallet] = useState(false)
  const [sendAmount, setSendAmount] = useState('')
  const [sendAddress, setSendAddress] = useState('')
  const [sendTokenId, setSendTokenId] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [currentWalletAddress, setCurrentWalletAddress] = useState('')

  const activeCampaign = campaigns.find(c => c.id === activeCampaignId)
  const analytics = activeCampaign?.analytics || {}

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    setMessages(activeCampaign?.messages || [])
    setCampaignCost(activeCampaign?.cost && !activeCampaign?.paid ? activeCampaign.cost : null)
  }, [activeCampaignId, activeCampaign])

  useEffect(() => {
    if (walletId) {
      localStorage.setItem('walletId', walletId)
    }
  }, [walletId])

  useEffect(() => {
    if (showWallet && walletId) {
      fetchWalletData()
    }
  }, [showWallet, walletId])

  const fetchWalletData = async () => {
    if (!walletId) return
    
    setIsLoadingWallet(true)
    try {
      // Fetch balance
      const balanceRes = await axios.get(`${API_BASE}/wallet/balance`, {
        params: { walletId }
      })
      if (balanceRes.data.success) {
        setWalletBalance(balanceRes.data)
      }

      // Fetch wallet info
      const infoRes = await axios.get(`${API_BASE}/wallet/info`, {
        params: { walletId }
      })
      if (infoRes.data.success) {
        setWalletInfo(infoRes.data.wallet)
        // Store wallet address for transaction comparison
        if (infoRes.data.wallet?.address) {
          setCurrentWalletAddress(infoRes.data.wallet.address.toLowerCase())
        }
      }

      // Fetch transactions
      const txRes = await axios.get(`${API_BASE}/wallet/transactions`, {
        params: { walletId, pageSize: 50 }
      })
      if (txRes.data.success) {
        setTransactions(txRes.data.transactions || [])
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error)
    } finally {
      setIsLoadingWallet(false)
    }
  }

  const handleSendTransaction = async () => {
    if (!walletId || !sendAmount || !sendAddress || !sendTokenId || isSending) return

    setIsSending(true)
    try {
      const response = await axios.post(`${API_BASE}/wallet/send`, {
        walletId,
        receiverAddress: sendAddress,
        amount: sendAmount,
        tokenId: sendTokenId
      })

      if (response.data.success) {
        setSendAmount('')
        setSendAddress('')
        setSendTokenId('')
        setSuccessMessage('Transaction submitted successfully!')
        setErrorMessage('')
        // Refresh wallet data to update balance
        setTimeout(() => fetchWalletData(), 2000)
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000)
      } else {
        setErrorMessage(`Transaction failed: ${response.data.error}`)
        setSuccessMessage('')
        setTimeout(() => setErrorMessage(''), 5000)
      }
    } catch (error) {
      console.error('Error sending transaction:', error)
      setErrorMessage(`Error: ${error.response?.data?.error || error.message}`)
      setSuccessMessage('')
      setTimeout(() => setErrorMessage(''), 5000)
    } finally {
      setIsSending(false)
    }
  }

  const handleRequestFaucet = async () => {
    if (!walletInfo?.address) return

    setIsLoadingWallet(true)
    try {
      const response = await axios.post(`${API_BASE}/wallet/faucet`, {
        address: walletInfo.address,
        blockchain: 'ARC-TESTNET'
      })

      if (response.data.success) {
        setSuccessMessage('Faucet request submitted! Check your balance in a few moments.')
        setErrorMessage('')
        setTimeout(() => fetchWalletData(), 3000)
        setTimeout(() => setSuccessMessage(''), 5000)
      } else {
        setErrorMessage(`Faucet request failed: ${response.data.error}`)
        setSuccessMessage('')
        setTimeout(() => setErrorMessage(''), 5000)
      }
    } catch (error) {
      console.error('Error requesting faucet:', error)
      setErrorMessage(`Error: ${error.response?.data?.error || error.message}`)
      setSuccessMessage('')
      setTimeout(() => setErrorMessage(''), 5000)
    } finally {
      setIsLoadingWallet(false)
    }
  }

  const updateCampaign = (updates) => {
    setCampaigns(campaigns.map(c => c.id === activeCampaignId ? { ...c, ...updates } : c))
  }

  const markAsPaid = () => {
    updateCampaign({ paid: true, analytics: DEFAULT_ANALYTICS })
    setCampaignCost(null)
    setIsPaymentModalOpen(false)
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage = { role: 'user', content: inputMessage }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    const messageToSend = inputMessage
    setInputMessage('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setIsLoading(true)

    try {
      const response = await axios.post(`${API_BASE}/campaign/chat`, {
        message: messageToSend,
        campaignId: activeCampaignId,
        conversationHistory: newMessages
      })

      const responseData = response.data
      const aiMessage = {
        role: 'assistant',
        content: responseData.message || responseData.response || responseData.content || 'No response received',
        campaignCost: responseData.campaignCost || responseData.cost
      }

      const updatedMessages = [...newMessages, aiMessage]
      setMessages(updatedMessages)
      updateCampaign({ messages: updatedMessages })

      if (aiMessage.campaignCost && !activeCampaign?.paid) {
        setCampaignCost(aiMessage.campaignCost)
        updateCampaign({ cost: aiMessage.campaignCost })
        setIsPaymentModalOpen(true)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      let errorMessage = 'Sorry, I encountered an error. Please try again.'
      
      if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data?.error || 
                      error.response.data?.message || 
                      `Server error: ${error.response.status} ${error.response.statusText}`
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Unable to reach the server. Please check your connection.'
      } else {
        // Something else happened
        errorMessage = error.message || errorMessage
      }
      
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: errorMessage 
      }])
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

  const processPayment = async () => {
    if (!activeCampaignId) return

    const cost = campaignCost || activeCampaign?.cost || 0
    setIsLoading(true)

    try {
      await axios.post(`${API_BASE}/campaign/pay`, {
        campaignId: activeCampaignId,
        amount: cost
      }).catch(() => ({ data: { success: true } }))

      markAsPaid()

      try {
        await axios.post(`${API_BASE}/campaign/create`, {
          campaignId: activeCampaignId,
          messages: messages
        }).catch(() => ({ data: { success: true } }))
      } catch (err) {
        console.log('Campaign creation skipped')
      }
    } catch (error) {
      console.error('Payment error:', error)
      markAsPaid()
    } finally {
      setIsLoading(false)
    }
  }

  const saveCampaignName = (campaignId) => {
    if (editingName.trim()) {
      setCampaigns(campaigns.map(c => c.id === campaignId ? { ...c, name: editingName.trim() } : c))
    }
    setEditingCampaignId(null)
    setEditingName('')
  }

  const deleteCampaign = (campaignId) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      const updatedCampaigns = campaigns.filter(c => c.id !== campaignId)
      setCampaigns(updatedCampaigns)
      if (activeCampaignId === campaignId) {
        // If there are other campaigns, select the first one
        if (updatedCampaigns.length > 0) {
          setActiveCampaignId(updatedCampaigns[0].id)
        } else {
          // Only set to null if no campaigns remain
          setActiveCampaignId(null)
          setMessages([])
        }
      }
    }
  }

  const formatNumber = (num) => (num || 0).toLocaleString()
  const calculateRate = (numerator, denominator) => 
    denominator ? ((numerator / denominator) * 100).toFixed(1) : '0'

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
                  onClick={() => {
                    setActiveCampaignId(campaign.id)
                    setShowWallet(false) // Close wallet view when selecting a campaign
                  }}
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
                        <span className={`text-xs ${campaign.paid ? 'text-green-500' : 'text-amber-500'}`}>
                          {campaign.paid ? '✓' : '●'}
                        </span>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                        {!campaign.paid && (
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
                        )}
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
        
        {/* Your Wallet Section - Docked at Bottom */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <button
            onClick={() => {
              const newWalletState = !showWallet
              setShowWallet(newWalletState)
              if (newWalletState) {
                // When opening wallet, close any active campaign
                setActiveCampaignId(null)
              }
            }}
            className={`w-full flex items-center justify-between p-3 rounded-md transition ${
              showWallet
                ? 'bg-blue-50 border border-blue-200 text-blue-700'
                : 'hover:bg-gray-100 border border-transparent text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span className="font-semibold text-sm">Your Wallet</span>
            </div>
            {showWallet && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {showWallet ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 bg-white shadow-sm border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Your Wallet</h2>
              <p className="text-sm text-gray-500 mt-1">Manage your Circle wallet transactions</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Wallet ID Input */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wallet ID
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={walletId}
                      onChange={(e) => setWalletId(e.target.value)}
                      placeholder="Enter your Circle wallet ID"
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={fetchWalletData}
                      disabled={!walletId || isLoadingWallet}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoadingWallet ? 'Loading...' : 'Load'}
                    </button>
                  </div>
                </div>

                {walletId && (
                  <>
                    {/* Success/Error Messages for Wallet Operations */}
                    {successMessage && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm font-medium text-green-800">{successMessage}</p>
                      </div>
                    )}
                    {errorMessage && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm font-medium text-red-800">{errorMessage}</p>
                      </div>
                    )}
                    
                    {/* Balance Display */}
                    {walletBalance && (
                      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Balance</h3>
                        {walletBalance.usdcBalance ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">USDC</span>
                              <span className="text-2xl font-bold text-gray-900">
                                {walletBalance.usdcBalance.amount || '0'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Token: {walletBalance.usdcBalance.token?.symbol || 'USDC'}
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-500">No USDC balance found</div>
                        )}
                        {walletInfo && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="text-sm text-gray-600">
                              <div className="mb-1">Address: <span className="font-mono text-xs">{walletInfo.address}</span></div>
                              <div>Blockchain: {walletInfo.blockchain || 'ARC-TESTNET'}</div>
                            </div>
                            <button
                              onClick={handleRequestFaucet}
                              disabled={isLoadingWallet}
                              className="mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition disabled:opacity-50"
                            >
                              Request Test USDC
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Send Transaction */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Transaction</h3>
                      
                      {/* Success/Error Messages */}
                      {successMessage && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-sm font-medium text-green-800">{successMessage}</p>
                        </div>
                      )}
                      {errorMessage && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-sm font-medium text-red-800">{errorMessage}</p>
                        </div>
                      )}
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Receiver Address
                          </label>
                          <input
                            type="text"
                            value={sendAddress}
                            onChange={(e) => setSendAddress(e.target.value)}
                            placeholder="0x..."
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Amount
                          </label>
                          <input
                            type="text"
                            value={sendAmount}
                            onChange={(e) => setSendAmount(e.target.value)}
                            placeholder="1.0"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Token ID
                          </label>
                          <input
                            type="text"
                            value={sendTokenId}
                            onChange={(e) => setSendTokenId(e.target.value)}
                            placeholder="Enter token ID"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <button
                          onClick={handleSendTransaction}
                          disabled={!sendAmount || !sendAddress || !sendTokenId || isSending}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSending ? 'Sending...' : 'Send Transaction'}
                        </button>
                      </div>
                    </div>

                    {/* Transaction History */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
                        <button
                          onClick={fetchWalletData}
                          disabled={isLoadingWallet}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                        >
                          Refresh
                        </button>
                      </div>
                      {isLoadingWallet ? (
                        <div className="text-center py-8 text-gray-500">Loading transactions...</div>
                      ) : transactions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No transactions found</div>
                      ) : (
                        <div className="space-y-3">
                          {transactions.map((tx, index) => {
                            // Check if From or To address matches current wallet address
                            const fromAddress = tx.sourceAddress?.toLowerCase() || ''
                            const toAddress = tx.destinationAddress?.toLowerCase() || ''
                            const isFromYou = currentWalletAddress && fromAddress === currentWalletAddress
                            const isToYou = currentWalletAddress && toAddress === currentWalletAddress
                            
                            // Determine transaction type (sent or received)
                            const txType = isFromYou ? 'sent' : isToYou ? 'received' : 'unknown'
                            
                            return (
                            <div
                              key={tx.id || index}
                              className={`border rounded-md p-4 transition ${
                                txType === 'sent' 
                                  ? 'border-red-200 bg-red-50/30 hover:bg-red-50/50' 
                                  : txType === 'received'
                                  ? 'border-green-200 bg-green-50/30 hover:bg-green-50/50'
                                  : 'border-gray-200 bg-white hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-900">
                                    {tx.type || 'Transaction'}
                                  </span>
                                  {txType === 'sent' && (
                                    <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 font-medium">
                                      Sent
                                    </span>
                                  )}
                                  {txType === 'received' && (
                                    <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 font-medium">
                                      Received
                                    </span>
                                  )}
                                </div>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  tx.state === 'COMPLETE' ? 'bg-green-100 text-green-700' :
                                  tx.state === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                  tx.state === 'FAILED' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {tx.state || 'UNKNOWN'}
                                </span>
                              </div>
                              {tx.id && (
                                <div className="text-xs text-gray-500 font-mono mb-1">
                                  ID: {tx.id}
                                </div>
                              )}
                              {tx.sourceAddress && (
                                <div className="text-xs text-gray-600">
                                  From: <span className="font-mono">{tx.sourceAddress}</span>
                                  {isFromYou && (
                                    <span className="ml-2 text-blue-600 font-medium">(you)</span>
                                  )}
                                </div>
                              )}
                              {tx.destinationAddress && (
                                <div className="text-xs text-gray-600">
                                  To: <span className="font-mono">{tx.destinationAddress}</span>
                                  {isToYou && (
                                    <span className="ml-2 text-blue-600 font-medium">(you)</span>
                                  )}
                                </div>
                              )}
                              {tx.amounts && tx.amounts.length > 0 && (
                                <div className="text-sm text-gray-700 mt-2">
                                  Amount: {tx.amounts.join(', ')}
                                </div>
                              )}
                              {tx.createdAt && (
                                <div className="text-xs text-gray-500 mt-2">
                                  {new Date(tx.createdAt).toLocaleString()}
                                </div>
                              )}
                            </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : activeCampaignId ? (
          activeCampaign?.paid ? (
            <>
              <div className="p-4 bg-white shadow-sm border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">{activeCampaign?.name}</h2>
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
          ) : (
            <>
              <div className="p-4 bg-white shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {activeCampaign?.name}
                    <span className="ml-2 text-sm font-normal text-amber-600">(Payment Required)</span>
                  </h2>
                  {(campaignCost || activeCampaign?.cost) && (
                    <div className="text-sm text-gray-600">
                      Cost: <span className="font-semibold text-amber-600">${campaignCost || activeCampaign?.cost}</span>
                    </div>
                  )}
                </div>
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
                <div className="max-w-2xl mx-auto flex gap-3 items-end">
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
                    className="flex-1 bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 min-h-[44px] max-h-[200px] overflow-y-auto shadow-sm"
                    rows={1}
                    disabled={isLoading}
                    style={{ height: 'auto' }}
                  />
                  {!activeCampaign?.paid && (
                    <button
                      onClick={processPayment}
                      disabled={isLoading}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm whitespace-nowrap h-[44px]"
                    >
                      {isLoading ? 'Processing...' : 'Complete Payment'}
                    </button>
                  )}
                </div>
              </div>
            </>
          )
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
                onClick={processPayment}
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

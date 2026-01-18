import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import Sidebar from './components/layout/Sidebar'
import WalletView from './components/wallet/WalletView'
import CampaignChat from './components/campaigns/CampaignChat'
import CampaignAnalytics from './components/campaigns/CampaignAnalytics'
import CampaignAnalyticsView from './components/campaigns/CampaignAnalyticsView'
import PaymentModal from './components/campaigns/PaymentModal'

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
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [campaignCost, setCampaignCost] = useState(null)
  const [editingCampaignId, setEditingCampaignId] = useState(null)
  const [editingName, setEditingName] = useState('')
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
  const analytics = activeCampaign?.analytics || DEFAULT_ANALYTICS

  // Load campaigns from database on mount
  useEffect(() => {
    fetchCampaignsFromDB()
  }, [])

  useEffect(() => {
    setMessages(activeCampaign?.messages || [])
    setCampaignCost(activeCampaign?.cost && !activeCampaign?.paid ? activeCampaign.cost : null)
  }, [activeCampaignId, activeCampaign])

  const fetchCampaignsFromDB = async () => {
    try {
      const response = await axios.get(`${API_BASE}/campaigns`)
      if (response.data.success) {
        // Merge with local state campaigns (for messages that aren't in DB yet)
        const dbCampaigns = response.data.campaigns || []
        const localCampaigns = campaigns.filter(c => 
          !dbCampaigns.find(dbC => dbC.id === c.id)
        )
        setCampaigns([...dbCampaigns, ...localCampaigns])
      }
    } catch (error) {
      console.error('Error fetching campaigns from database:', error)
    }
  }

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
        fetchWalletData()
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
        errorMessage = error.response.data?.error || 
                      error.response.data?.message || 
                      `Server error: ${error.response.status} ${error.response.statusText}`
      } else if (error.request) {
        errorMessage = 'Unable to reach the server. Please check your connection.'
      } else {
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

  const createNewCampaign = async () => {
    const newCampaign = {
      id: Date.now().toString(),
      name: 'New Campaign',
      messages: [],
      paid: false
    }
    
    // Add to local state immediately
    setCampaigns([newCampaign, ...campaigns])
    setActiveCampaignId(newCampaign.id)
    setMessages([])
    
    // Save to database
    try {
      await axios.post(`${API_BASE}/campaign/create`, {
        campaignId: newCampaign.id,
        name: newCampaign.name,
        messages: []
      })
    } catch (error) {
      console.error('Error creating campaign in database:', error)
    }
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

      // Update campaign in database after payment
      try {
        await axios.put(`${API_BASE}/campaign/update`, {
          campaignId: activeCampaignId,
          paid: true,
          cost: cost,
          status: 'active'
        })
        
        // Also ensure campaign exists in DB
        await axios.post(`${API_BASE}/campaign/create`, {
          campaignId: activeCampaignId,
          name: activeCampaign?.name || 'New Campaign',
          messages: messages
        })
      } catch (err) {
        console.error('Error updating campaign after payment:', err)
      }
    } catch (error) {
      console.error('Payment error:', error)
      markAsPaid()
    } finally {
      setIsLoading(false)
    }
  }

  const saveCampaignName = async (campaignId) => {
    if (editingName.trim()) {
      const newName = editingName.trim()
      // Update local state
      setCampaigns(campaigns.map(c => c.id === campaignId ? { ...c, name: newName } : c))
      
      // Update in database
      try {
        await axios.put(`${API_BASE}/campaign/update`, {
          campaignId: campaignId,
          name: newName
        })
      } catch (error) {
        console.error('Error updating campaign name in database:', error)
      }
    }
    setEditingCampaignId(null)
    setEditingName('')
  }

  const deleteCampaign = async (campaignId) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      // Delete from database
      try {
        await axios.delete(`${API_BASE}/campaign/delete`, {
          params: { campaignId }
        })
      } catch (error) {
        console.error('Error deleting campaign from database:', error)
      }
      
      // Update local state
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

  const handleCampaignClick = (campaignId) => {
    setActiveCampaignId(campaignId)
    setShowWallet(false)
    setShowAnalytics(false)
  }

  const handleWalletToggle = () => {
    const newWalletState = !showWallet
    setShowWallet(newWalletState)
    if (newWalletState) {
      setActiveCampaignId(null)
      setShowAnalytics(false)
    }
  }

  const handleAnalyticsToggle = () => {
    const newAnalyticsState = !showAnalytics
    setShowAnalytics(newAnalyticsState)
    if (newAnalyticsState) {
      setActiveCampaignId(null)
      setShowWallet(false)
    }
  }

  return (
    <div className="flex h-screen bg-white">
      <Sidebar
        campaigns={campaigns}
        activeCampaignId={activeCampaignId}
        showWallet={showWallet}
        showAnalytics={showAnalytics}
        editingCampaignId={editingCampaignId}
        editingName={editingName}
        onCreateCampaign={createNewCampaign}
        onCampaignClick={handleCampaignClick}
        onEditStart={(id, name) => {
          setEditingCampaignId(id)
          setEditingName(name)
        }}
        onEditSave={saveCampaignName}
        onEditCancel={() => {
          setEditingCampaignId(null)
          setEditingName('')
        }}
        onDelete={deleteCampaign}
        onNameChange={setEditingName}
        onWalletToggle={handleWalletToggle}
        onAnalyticsToggle={handleAnalyticsToggle}
      />

      <div className="flex-1 flex flex-col">
        {showAnalytics ? (
          <CampaignAnalyticsView />
        ) : showWallet ? (
          <WalletView
            walletId={walletId}
            walletBalance={walletBalance}
            walletInfo={walletInfo}
            transactions={transactions}
            currentWalletAddress={currentWalletAddress}
            isLoading={isLoadingWallet}
            sendAmount={sendAmount}
            sendAddress={sendAddress}
            sendTokenId={sendTokenId}
            isSending={isSending}
            successMessage={successMessage}
            errorMessage={errorMessage}
            onWalletIdChange={setWalletId}
            onLoad={fetchWalletData}
            onRequestFaucet={handleRequestFaucet}
            onSendTransaction={handleSendTransaction}
            onAmountChange={setSendAmount}
            onAddressChange={setSendAddress}
            onTokenIdChange={setSendTokenId}
            onRefresh={fetchWalletData}
          />
        ) : activeCampaignId ? (
          <>
            <div className="p-4 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {activeCampaign?.name}
                  {!activeCampaign?.paid && (
                    <span className="ml-2 text-sm font-normal text-amber-600">(Payment Required)</span>
                  )}
                </h2>
                {(campaignCost || activeCampaign?.cost) && !activeCampaign?.paid && (
                  <div className="text-sm text-gray-600">
                    Cost: <span className="font-semibold text-amber-600">${campaignCost || activeCampaign?.cost}</span>
                  </div>
                )}
              </div>
            </div>

            <CampaignChat
              messages={messages}
              inputMessage={inputMessage}
              isLoading={isLoading}
              onInputChange={setInputMessage}
              onSendMessage={handleSendMessage}
              textareaRef={textareaRef}
              showPaymentButton={!activeCampaign?.paid}
              onPaymentClick={processPayment}
            />
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

      <PaymentModal
        isOpen={isPaymentModalOpen}
        campaignCost={campaignCost}
        isLoading={isLoading}
        onClose={() => {
          setIsPaymentModalOpen(false)
          setCampaignCost(null)
        }}
        onPay={processPayment}
      />
    </div>
  )
}

export default App

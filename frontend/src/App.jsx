import { useState, useRef, useEffect, useCallback } from 'react'
import axios from 'axios'
import Sidebar from './components/layout/Sidebar'
import WalletView from './components/wallet/WalletView'
import CampaignChat from './components/campaigns/CampaignChat'
import CampaignAnalytics from './components/campaigns/CampaignAnalytics'
import CampaignAnalyticsView from './components/campaigns/CampaignAnalyticsView'
import LoadingSpinner from './components/shared/LoadingSpinner'
import ConfirmationModal from './components/shared/ConfirmationModal'
import { useAuth } from './context/AuthContext'
import Login from './components/auth/Login'
import { DEFAULT_ANALYTICS, CAMPAIGN_COST } from './constants'

const API_BASE = '/api'

import CustomerResponse from './components/customer/CustomerResponse'

function App() {
  const { user, logout, loading: authLoading } = useAuth()

  const [campaigns, setCampaigns] = useState([])
  const [activeCampaignId, setActiveCampaignId] = useState(null)
  const [showWallet, setShowWallet] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [editingCampaignId, setEditingCampaignId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const textareaRef = useRef(null)

  // Wallet state - isolate by user
  const [walletId, setWalletId] = useState('')
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

  // Sync walletId when user changes
  useEffect(() => {
    if (user?.sub) {
      const storedWalletId = localStorage.getItem(`walletId_${user.sub}`) || import.meta.env.VITE_WALLET_ID || '';
      setWalletId(storedWalletId);
    } else {
      setWalletId('');
    }
  }, [user])

  useEffect(() => {
    if (user?.sub && walletId) {
      localStorage.setItem(`walletId_${user.sub}`, walletId);
    }
  }, [walletId, user])

  const [currentWalletAddress, setCurrentWalletAddress] = useState('')
  const [pendingCost, setPendingCost] = useState(0)
  const [isPaymentPending, setIsPaymentPending] = useState(false)

  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [campaignToDelete, setCampaignToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const activeCampaign = campaigns.find(c => c.id === activeCampaignId)
  const analytics = activeCampaign?.analytics || DEFAULT_ANALYTICS

  // Load campaigns from database on mount (only if user exists)
  useEffect(() => {
    // Clear all state FIRST when user changes
    setCampaigns([])
    setActiveCampaignId(null)
    setMessages([])
    setWalletBalance(null)
    setTransactions([])

    if (user) {
      fetchCampaignsFromDB()
    }
  }, [user?.sub]) // Use user.sub to be specific about identity change

  // if (authLoading) return <div className="h-screen flex items-center justify-center"><LoadingSpinner /></div>
  // if (!user) return <Login />

  // Load messages when campaign changes
  useEffect(() => {
    const campaign = campaigns.find(c => c.id === activeCampaignId)
    setMessages(campaign?.messages || [])
  }, [activeCampaignId, campaigns])

  // Reset payment state only when switching campaigns (not on every campaign update)
  // This ensures each "session" with a campaign starts fresh
  useEffect(() => {
    // Reset payment pending state when switching to a different campaign
    // Payment state is only set during current session when agent returns a cost
    setPendingCost(0)
    setIsPaymentPending(false)
  }, [activeCampaignId])

  const fetchCampaignsFromDB = async () => {
    try {
      const response = await axios.get(`${API_BASE}/campaigns`)
      if (response.data.success) {
        setCampaigns(response.data.campaigns || [])
      }
    } catch (error) {
      console.error('Error fetching campaigns from database:', error)
    }
  }

  // REMOVED: Global walletId storage - now user-partitioned above

  // Fetch wallet data when user is logged in (for balance widget shown everywhere)
  useEffect(() => {
    if (user) {
      fetchWalletData()
    }
  }, [user, walletId])

  const fetchWalletData = useCallback(async () => {

    // if (!walletId) return - Fetch even if empty, allow backend to use env var

    setIsLoadingWallet(true)
    try {
      // Fetch balance
      const balanceRes = await axios.get(`${API_BASE}/wallet/balance`, {
        params: {
          walletId,
          _t: Date.now() // Cache buster
        }
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
  }, [walletId])

  // Poll for wallet balance (runs while user is logged in to keep balance widget updated)
  useEffect(() => {
    if (user && !showAnalytics) {
      // Poll every 30 seconds for balance (lighter polling since we aggressively fetch after payments)
      const interval = setInterval(fetchWalletData, 30000)
      return () => clearInterval(interval)
    }
  }, [fetchWalletData, user, showAnalytics])

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

  // Save messages and pending cost to database
  const saveMessagesToDB = async (campaignId, messagesArray, costToSave = null) => {
    try {
      const updateData = {
        campaignId: campaignId,
        messages: messagesArray
      }
      if (costToSave !== null) {
        updateData.pendingCost = costToSave
      }
      await axios.put(`${API_BASE}/campaign/update`, updateData)
    } catch (error) {
      console.error('Error saving messages to database:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    // Block sending new messages when payment is pending
    if (isPaymentPending && pendingCost > 0) {
      const userMessage = { role: 'user', content: inputMessage }
      const paymentReminderMessage = {
        role: 'assistant',
        content: `Please complete the payment of ${pendingCost.toFixed(2)} USDC to proceed. Click the "Pay ${pendingCost.toFixed(2)} USDC" button to continue.`
      }
      const updatedMessages = [...messages, userMessage, paymentReminderMessage]
      setMessages(updatedMessages)
      setInputMessage('')
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
      // Save messages but don't reset pending cost
      saveMessagesToDB(activeCampaignId, updatedMessages)
      return
    }

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
      // Ensure content is always a string (handle object responses)
      let contentValue = responseData.message || responseData.response || responseData.content || 'No response received'
      if (typeof contentValue !== 'string') {
        contentValue = JSON.stringify(contentValue, null, 2)
      }
      
      // Handle cost from response
      const cost = responseData.cost || 0
      if (cost > 0) {
        setPendingCost(cost)
        setIsPaymentPending(true)
      } else {
        setPendingCost(0)
        setIsPaymentPending(false)
      }
      
      const aiMessage = {
        role: 'assistant',
        content: contentValue
      }
      const updatedMessages = [...newMessages, aiMessage]
      setMessages(updatedMessages)
      updateCampaign({ messages: updatedMessages, pendingCost: cost })
      
      // Persist messages and pending cost to database
      saveMessagesToDB(activeCampaignId, updatedMessages, cost)
    } catch (error) {
      console.error('Error sending message:', error)
      let errorMessage = 'Sorry, I encountered an error. Please try again.'

      if (error.response) {
        const errData = error.response.data?.error || error.response.data?.message
        errorMessage = typeof errData === 'string' 
          ? errData 
          : `Server error: ${error.response.status} ${error.response.statusText}`
      } else if (error.request) {
        errorMessage = 'Unable to reach the server. Please check your connection.'
      } else {
        errorMessage = error.message || errorMessage
      }

      const errorMessages = [...newMessages, {
        role: 'assistant',
        content: errorMessage
      }]
      setMessages(errorMessages)
      // Save even error messages so user doesn't lose context
      saveMessagesToDB(activeCampaignId, errorMessages)
    } finally {
      setIsLoading(false)
    }
  }

  // Direct payment - no modal, executes immediately when Pay button is clicked
  const processPayment = async () => {
    if (isLoading || !activeCampaignId || !isPaymentPending || pendingCost <= 0) return
    
    setIsLoading(true)
    try {
      const paymentAmount = pendingCost
      
      // 1. Send transaction (walletId will be picked up from .env by backend if empty)
      const sendRes = await axios.post(`${API_BASE}/wallet/send`, {
        walletId: '',
        receiverAddress: '',
        amount: paymentAmount.toString(),
        tokenId: ''
      })

      if (sendRes.data.success || sendRes.data.challengeId) {
        // 2. Execute pending action after payment
        const payRes = await axios.post(`${API_BASE}/campaign/pay`, {
          campaignId: activeCampaignId,
          amount: paymentAmount
        })

        if (payRes.data.success) {
          // Aggressively refresh wallet balance to catch update
          fetchWalletData()
          setTimeout(() => fetchWalletData(), 1000)
          setTimeout(() => fetchWalletData(), 2000)
          setTimeout(() => fetchWalletData(), 4000)
          setTimeout(() => fetchWalletData(), 6000)
          
          // Check if another payment is required (e.g., filter after search)
          if (payRes.data.requires_payment && payRes.data.cost > 0) {
            // Add message about completing first action and needing next payment
            const progressMessage = {
              role: 'assistant',
              content: payRes.data.message || `Action completed. Next step requires payment.`
            }
            const updatedMessages = [...messages, progressMessage]
            setMessages(updatedMessages)
            
            // Set up the next payment
            setPendingCost(payRes.data.cost)
            setIsPaymentPending(true)
            
            // Save messages with new pending cost
            await saveMessagesToDB(activeCampaignId, updatedMessages, payRes.data.cost)
            
            // Update local campaign state - mark as PAID (green dot) since payment was processed
            setCampaigns(campaigns.map(c =>
              c.id === activeCampaignId 
                ? { ...c, messages: updatedMessages, paid: true, executed: true } 
                : c
            ))
          } else {
            // All done - reset payment state
            setPendingCost(0)
            setIsPaymentPending(false)
            
            // Add success message showing the tool result to conversation
            const successMessage = {
              role: 'assistant',
              content: payRes.data.message || `Payment successful! Action completed.`
            }
            const updatedMessages = [...messages, successMessage]
            setMessages(updatedMessages)
            
            // Save messages to DB
            await saveMessagesToDB(activeCampaignId, updatedMessages, 0)
            
            // Update local campaign state - mark as PAID (green dot)
            setCampaigns(campaigns.map(c =>
              c.id === activeCampaignId 
                ? { ...c, messages: updatedMessages, paid: true, executed: true } 
                : c
            ))
          }
        } else {
          // Reset payment state on failure
          setPendingCost(0)
          setIsPaymentPending(false)
          
          // Payment succeeded but action failed - show error
          const errorMessage = {
            role: 'assistant',
            content: payRes.data.message || `Payment processed but action failed. Please try again.`
          }
          const updatedMessages = [...messages, errorMessage]
          setMessages(updatedMessages)
          saveMessagesToDB(activeCampaignId, updatedMessages, 0)
        }
      } else {
        // Transaction failed - don't reset payment state so user can retry
        const errorMessage = {
          role: 'assistant',
          content: `Payment failed: ${sendRes.data.error || 'Transaction could not be processed'}. Please try again.`
        }
        const updatedMessages = [...messages, errorMessage]
        setMessages(updatedMessages)
        saveMessagesToDB(activeCampaignId, updatedMessages)
      }
    } catch (error) {
      console.error('Payment failed:', error)
      // Add error message to conversation
      const errorMsg = {
        role: 'assistant',
        content: `Payment failed: ${error.response?.data?.detail || error.message}. Please try again.`
      }
      const updatedMessages = [...messages, errorMsg]
      setMessages(updatedMessages)
      saveMessagesToDB(activeCampaignId, updatedMessages)
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

  const handleDeleteClick = (campaignId) => {
    setCampaignToDelete(campaignId)
    setShowDeleteModal(true)
  }

  const confirmDeleteCampaign = async () => {
    if (!campaignToDelete) return

    setIsDeleting(true)
    try {
      // Delete from database
      await axios.delete(`${API_BASE}/campaign/delete`, {
        params: { campaignId: campaignToDelete }
      })

      // Update local state
      const updatedCampaigns = campaigns.filter(c => c.id !== campaignToDelete)
      setCampaigns(updatedCampaigns)

      if (activeCampaignId === campaignToDelete) {
        // If there are other campaigns, select the first one
        if (updatedCampaigns.length > 0) {
          setActiveCampaignId(updatedCampaigns[0].id)
        } else {
          // Only set to null if no campaigns remain
          setActiveCampaignId(null)
          setMessages([])
        }
      }
    } catch (error) {
      console.error('Error deleting campaign from database:', error)
      alert(`Failed to delete campaign: ${error.message}`)
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
      setCampaignToDelete(null)
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

  if (window.location.pathname === '/customerResponse') {
    return <CustomerResponse />
  }

  if (authLoading) return <div className="h-screen flex items-center justify-center"><LoadingSpinner /></div>
  if (!user) return <Login />

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
        onDelete={handleDeleteClick}
        onNameChange={setEditingName}
        onWalletToggle={handleWalletToggle}
        onAnalyticsToggle={handleAnalyticsToggle}
        onLogout={logout}
      />

      <div className="flex-1 flex flex-col relative">
        {/* Wallet Balance Widget - Hidden on Analytics View */}
        {!showAnalytics && (
          <div className="absolute top-4 right-4 z-50">
            <div className="bg-white/90 backdrop-blur-md shadow-lg border border-gray-200 rounded-xl px-4 py-2 flex items-center gap-3 transition-all hover:shadow-xl hover:scale-105">
              <div className="flex flex-col items-end">
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Balance</span>
                <span className="text-gray-900 font-bold font-mono">
                  {walletBalance?.rawData?.data?.tokenBalances?.[0]?.amount
                    ? `$${parseFloat(walletBalance.rawData.data.tokenBalances[0].amount).toFixed(0.1)}`
                    : walletBalance?.usdcBalance?.amount
                      ? `$${parseFloat(walletBalance.usdcBalance.amount).toFixed(0.1)}`
                      : walletBalance ? '$0.00' : '...'}
                  <span className="text-xs text-gray-500 ml-1">USDC</span>
                </span>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        )}
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
              <h2 className="text-xl font-semibold text-gray-900">
                {activeCampaign?.name}
              </h2>
            </div>

            <CampaignChat
              messages={messages}
              inputMessage={inputMessage}
              isLoading={isLoading}
              onInputChange={setInputMessage}
              onSendMessage={handleSendMessage}
              textareaRef={textareaRef}
              onPay={processPayment}
              campaignCost={pendingCost > 0 ? pendingCost : CAMPAIGN_COST}
              pendingCost={pendingCost}
              isPaymentPending={isPaymentPending}
              isPaid={activeCampaign?.executed || activeCampaign?.paid || false}
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

      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Campaign"
        message="Are you sure you want to delete this campaign? This action cannot be undone and all associated data including analytics will be permanently removed."
        confirmText="Delete Campaign"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteCampaign}
        isLoading={isDeleting}
      />
    </div >
  )
}

export default App

import WalletInput from './WalletInput'
import WalletBalance from './WalletBalance'
import SendTransaction from './SendTransaction'
import TransactionList from './TransactionList'
import MessageBanner from '../shared/MessageBanner'

export default function WalletView({
  walletId,
  walletBalance,
  walletInfo,
  transactions,
  currentWalletAddress,
  isLoading,
  sendAmount,
  sendAddress,
  sendTokenId,
  isSending,
  successMessage,
  errorMessage,
  onWalletIdChange,
  onLoad,
  onRequestFaucet,
  onSendTransaction,
  onAmountChange,
  onAddressChange,
  onTokenIdChange,
  onRefresh
}) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 bg-white shadow-sm border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Your Wallet</h2>
        <p className="text-sm text-gray-500 mt-1">Manage your Circle wallet transactions</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <WalletInput 
            walletId={walletId}
            isLoading={isLoading}
            onWalletIdChange={onWalletIdChange}
            onLoad={onLoad}
          />

          {walletId && (
            <>
              <MessageBanner successMessage={successMessage} errorMessage={errorMessage} />
              
              <WalletBalance 
                walletBalance={walletBalance}
                walletInfo={walletInfo}
                isLoading={isLoading}
                onRequestFaucet={onRequestFaucet}
              />

              <SendTransaction
                sendAmount={sendAmount}
                sendAddress={sendAddress}
                sendTokenId={sendTokenId}
                isSending={isSending}
                successMessage={successMessage}
                errorMessage={errorMessage}
                onAmountChange={onAmountChange}
                onAddressChange={onAddressChange}
                onTokenIdChange={onTokenIdChange}
                onSend={onSendTransaction}
              />

              <TransactionList
                transactions={transactions}
                currentWalletAddress={currentWalletAddress}
                isLoading={isLoading}
                onRefresh={onRefresh}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

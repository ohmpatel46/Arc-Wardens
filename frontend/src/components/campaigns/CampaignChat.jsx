import { useRef, useEffect } from 'react'
import LoadingSpinner from '../shared/LoadingSpinner'

export default function CampaignChat({
  messages,
  inputMessage,
  isLoading,
  onInputChange,
  onSendMessage,
  textareaRef,
  onPay,
  isPaid,
  campaignCost = 1,
  pendingCost = 0,
  isPaymentPending = false
}) {
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-slate-50 relative">
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 w-full max-w-5xl mx-auto scrollbar-hide pb-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg mb-6 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2 font-[Inter]">Design Your Campaign</h2>
            <p className="text-gray-500 text-center max-w-md font-light">Tell me about your product, target audience, and goals. I'll help you craft the perfect outreach strategy.</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div
                className={`max-w-[85%] md:max-w-2xl text-base leading-relaxed p-4 md:px-6 md:py-4 shadow-sm ${message.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm'
                  : 'bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-sm'
                  }`}
              >
                <div className="whitespace-pre-wrap break-words font-[Inter]">
                  {typeof message.content === 'string'
                    ? message.content
                    : JSON.stringify(message.content, null, 2)}
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-6 py-4 shadow-sm flex items-center gap-3">
              <LoadingSpinner size="sm" />
              <span className="text-gray-400 text-sm font-medium">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-24" />
      </div>

      {/* Floating Input Area */}
      <div className="absolute bottom-6 left-0 right-0 px-4 md:px-6">
        <div className="max-w-4xl mx-auto relative group">
          {/* Ambient Glow for Focus */}
          <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl blur-xl transition-opacity duration-500 opacity-0 group-focus-within:opacity-100" />

          <div className="relative bg-white/90 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-2xl p-2 flex items-end gap-2 transition-all duration-300 ring-1 ring-gray-900/5 focus-within:ring-2 focus-within:ring-indigo-500/10 focus-within:border-indigo-500/30">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => {
                onInputChange(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  onSendMessage()
                }
              }}
              placeholder="Type your message..."
              className="flex-1 bg-transparent border-0 text-gray-900 px-4 py-3 placeholder:text-gray-400 focus:ring-0 focus:outline-none resize-none min-h-[48px] max-h-[150px] scrollbar-hide font-[Inter] text-base"
              rows={1}
              disabled={isLoading}
            />

            <div className="flex gap-2 pb-1 pr-1">
              {/* Show cost when payment is pending - regardless of isPaid (allows multiple payments per campaign) */}
              {isPaymentPending && pendingCost > 0 && (
                <span className="text-sm text-gray-600 flex items-center px-3">
                  Cost: {pendingCost.toFixed(2)} USDC
                </span>
              )}

              <button
                onClick={isPaymentPending && pendingCost > 0 ? onPay : onSendMessage}
                disabled={isLoading || (!(isPaymentPending && pendingCost > 0) && !inputMessage.trim())}
                className={`px-4 py-2.5 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500/30 ${(isPaymentPending && pendingCost > 0) || (inputMessage.trim() && !isLoading)
                  ? isPaymentPending && pendingCost > 0
                    ? 'bg-emerald-600 text-white shadow-md hover:bg-emerald-700 hover:scale-105 active:scale-95'
                    : 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:scale-105 active:scale-95'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
              >
                {/* Show Pay button when payment is pending - regardless of isPaid */}
                {isPaymentPending && pendingCost > 0 ? (
                  <span className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    Pay {pendingCost.toFixed(2)} USDC
                  </span>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-90" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div >
  )
}
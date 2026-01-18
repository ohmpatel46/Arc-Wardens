import { useRef, useEffect } from 'react'
import LoadingSpinner from '../shared/LoadingSpinner'

export default function CampaignChat({ 
  messages, 
  inputMessage, 
  isLoading, 
  onInputChange, 
  onSendMessage,
  textareaRef,
  showPaymentButton = false,
  onPaymentClick
}) {
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <>
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
              <LoadingSpinner />
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
              onInputChange(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onSendMessage()
              }
            }}
            placeholder="Describe your campaign, target audience, email tone, aggressiveness level..."
            className="flex-1 bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 min-h-[44px] max-h-[200px] overflow-y-auto shadow-sm"
            rows={1}
            disabled={isLoading}
            style={{ height: 'auto' }}
          />
          {showPaymentButton && (
            <button
              onClick={onPaymentClick}
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
}

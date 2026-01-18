export default function LoadingSpinner({ size = 'default' }) {
  const sizeClasses = {
    small: 'w-1.5 h-1.5',
    default: 'w-2 h-2',
    large: 'w-3 h-3'
  }

  return (
    <div className="flex gap-1">
      <span className={`${sizeClasses[size]} bg-gray-400 rounded-full animate-bounce`}></span>
      <span className={`${sizeClasses[size]} bg-gray-400 rounded-full animate-bounce`} style={{ animationDelay: '0.1s' }}></span>
      <span className={`${sizeClasses[size]} bg-gray-400 rounded-full animate-bounce`} style={{ animationDelay: '0.2s' }}></span>
    </div>
  )
}

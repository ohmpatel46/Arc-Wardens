export default function MessageBanner({ successMessage, errorMessage }) {
  if (!successMessage && !errorMessage) return null

  return (
    <>
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
    </>
  )
}

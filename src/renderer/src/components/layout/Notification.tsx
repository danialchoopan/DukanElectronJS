interface Props {
  message: string
}

export default function Notification({ message }: Props) {
  if (!message) return null

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-6 py-2 rounded-lg shadow-lg text-sm font-bold animate-pulse">
      {message}
    </div>
  )
}

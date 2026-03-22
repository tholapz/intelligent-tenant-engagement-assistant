import { useNavigate } from '@tanstack/react-router'
import type { FCMNotification } from '@/hooks/useFCM'

interface NotificationBannerProps {
  notification: FCMNotification
  onDismiss: () => void
}

export function NotificationBanner({ notification, onDismiss }: NotificationBannerProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (notification.leadId) {
      void navigate({ to: '/agent/leads/$leadId', params: { leadId: notification.leadId } })
    }
    onDismiss()
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-white shadow-xl rounded-xl border border-amber-400 p-4 max-w-sm animate-in slide-in-from-right">
      <div className="flex items-start gap-3">
        <span className="text-xl">⭐</span>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 text-sm">{notification.title}</p>
          <p className="text-sm text-gray-600 mt-0.5">{notification.body}</p>
          {notification.leadId && (
            <button
              onClick={handleClick}
              className="text-xs text-blue-600 hover:underline mt-2 block"
            >
              View Lead →
            </button>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  )
}

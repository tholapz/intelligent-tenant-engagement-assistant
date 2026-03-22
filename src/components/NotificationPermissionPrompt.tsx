import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useFCM } from '@/hooks/useFCM'

interface Props {
  uid: string
}

export function NotificationPermissionPrompt({ uid }: Props) {
  const { permission, requestPermission } = useFCM(uid)
  const [dismissed, setDismissed] = useState(false)
  const [requesting, setRequesting] = useState(false)

  if (permission !== 'default' || dismissed) return null

  const handleAllow = async () => {
    setRequesting(true)
    await requestPermission(uid)
    setRequesting(false)
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white shadow-xl rounded-xl border p-4 max-w-md w-full mx-4">
      <p className="font-semibold text-gray-900 text-sm mb-1">Enable push notifications</p>
      <p className="text-sm text-gray-500 mb-3">
        Get instant alerts when high-priority leads arrive, even when you're not on this page.
      </p>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => void handleAllow()} disabled={requesting}>
          {requesting ? 'Enabling…' : 'Allow Notifications'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setDismissed(true)}
        >
          Not now
        </Button>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { getToken, onMessage } from 'firebase/messaging'
import { doc, setDoc } from 'firebase/firestore'
import { db, getMessagingInstance } from '@/lib/firebase'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined

export interface FCMNotification {
  title: string
  body: string
  leadId?: string
}

export function useFCM(uid: string | null) {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default',
  )
  const [notification, setNotification] = useState<FCMNotification | null>(null)

  useEffect(() => {
    if (!uid) return

    let cleanup: (() => void) | undefined

    void (async () => {
      const messaging = await getMessagingInstance()
      if (!messaging) return

      if (Notification.permission === 'granted') {
        await registerToken(messaging, uid)
        cleanup = onMessage(messaging, (payload) => {
          setNotification({
            title: payload.notification?.title ?? 'New Lead',
            body: payload.notification?.body ?? '',
            leadId: payload.data?.leadId,
          })
        })
      }
    })()

    return () => {
      cleanup?.()
    }
  }, [uid])

  const requestPermission = async (targetUid: string) => {
    const result = await Notification.requestPermission()
    setPermission(result)
    if (result === 'granted') {
      const messaging = await getMessagingInstance()
      if (messaging) {
        await registerToken(messaging, targetUid)
      }
    }
    return result
  }

  return {
    permission,
    notification,
    requestPermission,
    clearNotification: () => setNotification(null),
  }
}

async function registerToken(
  messaging: Awaited<ReturnType<typeof getMessagingInstance>>,
  uid: string,
) {
  if (!messaging || !VAPID_KEY) return
  try {
    const token = await getToken(messaging, { vapidKey: VAPID_KEY })
    if (token) {
      await setDoc(
        doc(db, 'users', uid, 'fcm_tokens', token),
        { token, createdAt: new Date().toISOString() },
        { merge: true },
      )
    }
  } catch {
    // FCM token registration failed silently — email fallback applies
  }
}

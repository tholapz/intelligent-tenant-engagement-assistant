import { useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import type { ActivityLog, ConversationTurn, Lead, LeadStatus } from '@/types'
import { db } from '@/lib/firebase'

export function useLead(leadId: string) {
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ref = doc(db, 'leads', leadId)
    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setLead({ id: snap.id, ...snap.data() } as Lead)
      } else {
        setLead(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [leadId])

  return { lead, loading }
}

export function useConversation(sessionId: string) {
  const [turns, setTurns] = useState<Array<ConversationTurn>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) return
    const ref = collection(db, 'conversations', sessionId, 'turns')
    const q = query(ref, orderBy('timestamp', 'asc'))
    const unsubscribe = onSnapshot(q, (snap) => {
      setTurns(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ConversationTurn),
      )
      setLoading(false)
    })
    return unsubscribe
  }, [sessionId])

  return { turns, loading }
}

export function useActivityLog(leadId: string) {
  const [logs, setLogs] = useState<Array<ActivityLog>>([])

  useEffect(() => {
    const ref = collection(db, 'leads', leadId, 'activity_log')
    const q = query(ref, orderBy('timestamp', 'desc'))
    const unsubscribe = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ActivityLog))
    })
    return unsubscribe
  }, [leadId])

  return { logs }
}

export async function updateLeadStatus(
  leadId: string,
  fromStatus: LeadStatus,
  toStatus: LeadStatus,
  agentUid: string,
  agentName: string,
  note?: string,
) {
  const leadRef = doc(db, 'leads', leadId)
  const activityRef = collection(db, 'leads', leadId, 'activity_log')

  await updateDoc(leadRef, {
    status: toStatus,
    updatedAt: serverTimestamp(),
  })

  await addDoc(activityRef, {
    agentUid,
    agentName,
    timestamp: serverTimestamp(),
    fromStatus,
    toStatus,
    note: note ?? null,
  })
}

export async function addLeadNote(leadId: string, note: string) {
  const ref = doc(db, 'leads', leadId)
  await updateDoc(ref, { notes: note, updatedAt: serverTimestamp() })
}

export async function pinUnitToLead(leadId: string, unitCode: string) {
  const ref = doc(db, 'leads', leadId)
  await updateDoc(ref, {
    pinnedUnit: unitCode,
    updatedAt: serverTimestamp(),
  })
}

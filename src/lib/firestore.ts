import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from './firebase'
import type { ChatMessage, Conversation, Lead } from '../types/chat'

// US-001 B: Create new conversation session in Firestore
export async function createConversation(sessionId: string): Promise<void> {
  await setDoc(doc(db, 'conversations', sessionId), {
    sessionId,
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    messages: [],
  })
}

// US-006 X: Load conversation if session exists
export async function loadConversation(
  sessionId: string,
): Promise<Conversation | null> {
  const snap = await getDoc(doc(db, 'conversations', sessionId))
  if (!snap.exists()) return null

  const data = snap.data()
  // US-006 Z: check for 30-day expiry
  const updatedAt =
    data.updatedAt instanceof Timestamp
      ? data.updatedAt.toMillis()
      : data.updatedAt

  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
  if (Date.now() - updatedAt > thirtyDaysMs) {
    await updateDoc(doc(db, 'conversations', sessionId), { status: 'expired' })
    return null
  }

  return {
    sessionId: data.sessionId,
    status: data.status,
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt.toMillis()
        : data.createdAt,
    updatedAt,
    messages: (data.messages ?? []).slice(-20), // US-006 X: last 20 messages
  }
}

// Append a message turn to the conversation
export async function appendMessages(
  sessionId: string,
  messages: Array<ChatMessage>,
): Promise<void> {
  const ref = doc(db, 'conversations', sessionId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return

  const existing: Array<ChatMessage> = snap.data().messages ?? []
  await updateDoc(ref, {
    messages: [...existing, ...messages],
    updatedAt: serverTimestamp(),
  })
}

// US-005 S,T,W: Create or update lead with duplicate check
export async function upsertLead(
  lead: Omit<Lead, 'leadId' | 'createdAt'>,
): Promise<string> {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000

  if (lead.phone) {
    const q = query(
      collection(db, 'leads'),
      where('phone', '==', lead.phone),
      where('createdAt', '>=', Timestamp.fromMillis(thirtyDaysAgo)),
    )
    const existing = await getDocs(q)
    if (!existing.empty) {
      const existingDoc = existing.docs[0]
      await updateDoc(existingDoc.ref, {
        ...lead,
        updatedAt: serverTimestamp(),
      })
      return existingDoc.id
    }
  }

  const ref = await addDoc(collection(db, 'leads'), {
    ...lead,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

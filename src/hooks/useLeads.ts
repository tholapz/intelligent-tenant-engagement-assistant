import { useEffect, useState } from 'react'
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  limit,
  startAfter,
  getDocs,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Lead, LeadFilters } from '@/types'

const PAGE_SIZE = 20

export function useLeads(filters: LeadFilters = {}) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ref = collection(db, 'leads')
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')]

    if (filters.status && filters.status !== 'all') {
      constraints.push(where('status', '==', filters.status))
    }
    if (filters.mallPreference) {
      constraints.push(where('mallPreference', 'array-contains', filters.mallPreference))
    }
    if (filters.scoreMin !== undefined) {
      constraints.push(where('leadScore', '>=', filters.scoreMin))
    }
    if (filters.scoreMax !== undefined) {
      constraints.push(where('leadScore', '<=', filters.scoreMax))
    }

    const q = query(ref, ...constraints, limit(PAGE_SIZE))

    const unsubscribe = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Lead)
      setLeads(docs)
      setLoading(false)
    })

    return unsubscribe
  }, [
    filters.status,
    filters.mallPreference,
    filters.scoreMin,
    filters.scoreMax,
  ])

  return { leads, loading }
}

export async function fetchMoreLeads(
  lastDoc: QueryDocumentSnapshot<DocumentData>,
  filters: LeadFilters = {},
): Promise<{ leads: Lead[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> {
  const ref = collection(db, 'leads')
  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(PAGE_SIZE)]

  if (filters.status && filters.status !== 'all') {
    constraints.push(where('status', '==', filters.status))
  }

  const q = query(ref, ...constraints)
  const snap = await getDocs(q)
  const leads = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Lead)
  const newLastDoc = snap.docs[snap.docs.length - 1] ?? null
  return { leads, lastDoc: newLastDoc }
}

import type { Timestamp } from 'firebase/firestore'

export type UserRole = 'agent' | 'sales' | 'admin'

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  role: UserRole
  createdAt: Timestamp
}

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'site_visit_scheduled'
  | 'proposal_sent'
  | 'closed_won'
  | 'closed_lost'

export interface Lead {
  id: string
  prospectName: string
  contact: string
  businessType: string
  mallPreference: string[]
  leadScore: number
  status: LeadStatus
  createdAt: Timestamp
  updatedAt: Timestamp
  sessionId: string
  aiSummary?: string
  interestedUnits?: string[]
  assignedTo?: string
  notes?: string
}

export interface ConversationTurn {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Timestamp
}

export interface ActivityLog {
  id: string
  agentUid: string
  agentName: string
  timestamp: Timestamp
  fromStatus: LeadStatus
  toStatus: LeadStatus
  note?: string
}

export interface Mall {
  id: string
  name: string
  location: string
  totalUnits: number
}

export interface Unit {
  id: string
  unitCode: string
  mall: string
  floor: string
  zone: string
  sizeSqm: number
  baseRentThb: number
  serviceChargeThb: number
  earliestAvailableDate: string
  status: 'available' | 'occupied' | 'reserved'
  category: string
}

export interface MerchantProfile {
  businessType: string
  preferredMall?: string
  sizeRangeSqmMin: number
  sizeRangeSqmMax: number
  monthlyBudgetThb: number
}

export interface UnitRecommendation {
  unit: Unit
  score: number
  reason: string
}

export interface RecommendationResponse {
  recommendations: UnitRecommendation[]
  queryId: string
  generatedAt: string
}

export interface LeadFilters {
  status?: LeadStatus | 'all'
  mallPreference?: string
  scoreMin?: number
  scoreMax?: number
  dateFrom?: string
  dateTo?: string
}

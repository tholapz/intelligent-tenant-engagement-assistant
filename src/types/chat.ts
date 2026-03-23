export type MessageRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: number
}

export interface Conversation {
  sessionId: string
  status: 'active' | 'expired'
  createdAt: number
  updatedAt: number
  messages: Array<ChatMessage>
}

export interface Lead {
  leadId: string
  sessionId: string
  name: string
  phone?: string
  email?: string
  interestedUnits: Array<string>
  leadScore: number
  transcriptSummary: string
  createdAt: number
}

export interface SendMessageRequest {
  content: string
}

export interface SSEChunk {
  type: 'delta' | 'done' | 'error'
  content?: string
  error?: string
}

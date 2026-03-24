import type { SSEChunk } from '../types/chat'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

// US-002 G: Stream response via SSE from POST /api/v1/chat/{sessionId}/message
export async function* streamChatMessage(
  sessionId: string,
  content: string,
  idToken: string,
): AsyncGenerator<SSEChunk> {
  const response = await fetch(`${API_BASE}/api/v1/chat/${sessionId}/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({ content }),
  })

  if (!response.ok) {
    yield { type: 'error', error: `HTTP ${response.status}` }
    return
  }

  const reader = response.body?.getReader()
  if (!reader) {
    yield { type: 'error', error: 'No response body' }
    return
  }

  const decoder = new TextDecoder()
  let buffer = ''

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim()
        if (data === '[DONE]') {
          yield { type: 'done' }
          return
        }
        try {
          const chunk: SSEChunk = JSON.parse(data)
          yield chunk
        } catch {
          // skip malformed lines
        }
      }
    }
  }

  yield { type: 'done' }
}

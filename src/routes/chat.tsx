import { createRoute } from '@tanstack/react-router'
import ChatWindow from '../components/ChatWindow'
import type { RootRoute } from '@tanstack/react-router'

export default (rootRoute: RootRoute) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: '/chat',
    component: ChatPage,
  })

function ChatPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      <div className="border-b px-4 py-2 bg-white">
        <h1 className="font-semibold text-base">CPN Leasing Assistant</h1>
        <p className="text-xs text-muted-foreground">
          Ask about available spaces, leasing terms, or unit recommendations
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatWindow />
      </div>
    </div>
  )
}

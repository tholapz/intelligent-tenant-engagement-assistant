import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { AuthProvider } from './contexts/AuthContext'

import FormSimpleDemo from './routes/demo.form.simple.tsx'
import FormAddressDemo from './routes/demo.form.address.tsx'
import LoginRoute from './routes/login.tsx'
import AgentRoute from './routes/agent/index.tsx'
import LeadDetailRoute from './routes/agent/lead-detail.tsx'
import RecommendRoute from './routes/agent/recommend.tsx'

import App from './App.tsx'

import './styles.css'
import reportWebVitals from './reportWebVitals.ts'

const queryClient = new QueryClient()

const rootRoute = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <TanStackRouterDevtools />
      </AuthProvider>
    </QueryClientProvider>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: App,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  FormSimpleDemo(rootRoute),
  FormAddressDemo(rootRoute),
  LoginRoute(rootRoute),
  AgentRoute(rootRoute),
  LeadDetailRoute(rootRoute),
  RecommendRoute(rootRoute),
])

const router = createRouter({
  routeTree,
  context: {},
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('app')
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  )
}

reportWebVitals()

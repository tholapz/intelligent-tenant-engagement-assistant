import { useCallback, useRef, useState } from 'react'
import { createRoute, useNavigate } from '@tanstack/react-router'
import type { LeadFilters, LeadStatus } from '@/types'
import type { RootRoute } from '@tanstack/react-router'
import { useLeads } from '@/hooks/useLeads'
import { LeadCard } from '@/components/LeadCard'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'


const MALLS = [
  'Central World',
  'Central Ladprao',
  'Central Pinklao',
  'Central Bangna',
  'Central Chidlom',
  'Central Rama 9',
  'Central Eastville',
]

function AgentDashboard() {
  const { userProfile, logout } = useAuth()
  const navigate = useNavigate()
  const [filters, setFilters] = useState<LeadFilters>({ status: 'all' })
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 100])
  const { leads, loading } = useLeads({
    ...filters,
    scoreMin: scoreRange[0] > 0 ? scoreRange[0] : undefined,
    scoreMax: scoreRange[1] < 100 ? scoreRange[1] : undefined,
  })

  const observer = useRef<IntersectionObserver | null>(null)
  const lastLeadRef = useCallback((node: HTMLDivElement | null) => {
    if (observer.current) observer.current.disconnect()
    if (!node) return
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        // Infinite scroll - would fetch more leads here
      }
    })
    observer.current.observe(node)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
            C
          </div>
          <span className="font-semibold text-gray-900">
            CPN Internal Assistant
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void navigate({ to: '/agent/recommend' })}
          >
            Unit Recommendations
          </Button>
          <div className="text-sm text-gray-500">
            {userProfile?.displayName ?? userProfile?.email}
          </div>
          <Button variant="ghost" size="sm" onClick={() => void logout()}>
            Sign out
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Lead Pipeline</h1>
          <span className="text-sm text-gray-500">{leads.length} leads</span>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border p-4 mb-5 space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-40">
              <label className="text-xs text-gray-500 mb-1 block">Status</label>
              <Select
                value={filters.status ?? 'all'}
                onValueChange={(v) =>
                  setFilters((f) => ({ ...f, status: v as LeadStatus | 'all' }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="site_visit_scheduled">
                    Site Visit Scheduled
                  </SelectItem>
                  <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                  <SelectItem value="closed_won">Closed Won</SelectItem>
                  <SelectItem value="closed_lost">Closed Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-40">
              <label className="text-xs text-gray-500 mb-1 block">
                Mall Preference
              </label>
              <Select
                value={filters.mallPreference ?? 'all'}
                onValueChange={(v) =>
                  setFilters((f) => ({
                    ...f,
                    mallPreference: v === 'all' ? undefined : v,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All malls" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Malls</SelectItem>
                  {MALLS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-48">
              <label className="text-xs text-gray-500 mb-1 block">
                Lead Score: {scoreRange[0]}–{scoreRange[1]}
              </label>
              <Slider
                min={0}
                max={100}
                step={5}
                value={scoreRange}
                onValueChange={(v) => setScoreRange(v as [number, number])}
                className="mt-2"
              />
            </div>
          </div>
        </div>

        {/* Lead list */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            No leads found for the selected filters.
          </div>
        ) : (
          <div className="space-y-3">
            {leads.map((lead, i) => (
              <div
                key={lead.id}
                ref={i === leads.length - 1 ? lastLeadRef : null}
              >
                <LeadCard lead={lead} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AgentDashboardPage() {
  return (
    <ProtectedRoute>
      <AgentDashboard />
    </ProtectedRoute>
  )
}

export default (parentRoute: RootRoute) =>
  createRoute({
    getParentRoute: () => parentRoute,
    path: '/agent',
    component: AgentDashboardPage,
  })

import { createRoute } from '@tanstack/react-router'
import { useState } from 'react'
import type { RootRoute } from '@tanstack/react-router'
import { PdfUpload, type IngestionState } from '@/components/admin/PdfUpload'
import { UnitStatusManager, type Unit } from '@/components/admin/UnitStatusManager'
import {
  AnalyticsDashboard,
  type AnalyticsData,
  type KnowledgeGapEntry,
} from '@/components/admin/AnalyticsDashboard'

const sampleUnits: Unit[] = [
  { unitId: 'U001', name: 'Shop A-01', status: 'available', auditLog: [] },
  {
    unitId: 'U002',
    name: 'Shop B-02',
    status: 'leased',
    auditLog: [
      {
        changedByUid: 'admin@cpn.co.th',
        timestamp: '2026-03-20T10:00:00Z',
        fromStatus: 'available',
        toStatus: 'leased',
      },
    ],
  },
  { unitId: 'U003', name: 'Shop C-03', status: 'renovation', auditLog: [] },
]

const sampleAnalytics: AnalyticsData = {
  conversations: { daily: 12, weekly: 74, monthly: 310 },
  leadsCaptures: 28,
  leadConversionRate: 0.09,
  averageLeadScore: 67,
  topBusinessTypes: [
    { name: 'Restaurant', count: 40 },
    { name: 'Fashion', count: 30 },
    { name: 'Electronics', count: 20 },
    { name: 'Supermarket', count: 15 },
    { name: 'Cafe', count: 10 },
  ],
  topMalls: [
    { name: 'Central World', count: 55 },
    { name: 'Central Embassy', count: 42 },
    { name: 'Central Ladprao', count: 30 },
    { name: 'Central Eastville', count: 20 },
    { name: 'Central Rama 9', count: 18 },
  ],
}

const sampleGaps: KnowledgeGapEntry[] = [
  {
    conversationId: 'conv-1',
    query: 'What is the CAM fee structure?',
    timestamp: '2026-03-22T08:00:00Z',
  },
  {
    conversationId: 'conv-2',
    query: 'Do you allow food truck operators?',
    timestamp: '2026-03-22T09:00:00Z',
  },
]

function AdminDemo() {
  const [ingestionState, setIngestionState] = useState<IngestionState>({
    status: 'indexed',
    chunkCount: 38,
  })
  const [units, setUnits] = useState(sampleUnits)

  async function handleUpload(_file: File) {
    setIngestionState({ status: 'queued' })
    setTimeout(() => setIngestionState({ status: 'processing' }), 800)
    setTimeout(() => setIngestionState({ status: 'indexed', chunkCount: 38 }), 2000)
  }

  function handleStatusChange(unitId: string, newStatus: Unit['status']) {
    setUnits((prev) =>
      prev.map((u) =>
        u.unitId === unitId
          ? {
              ...u,
              status: newStatus,
              auditLog: [
                ...u.auditLog,
                {
                  changedByUid: 'admin@cpn.co.th',
                  timestamp: new Date().toISOString(),
                  fromStatus: u.status,
                  toStatus: newStatus,
                },
              ],
            }
          : u,
      ),
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-12">
      <h1 className="text-2xl font-bold">Admin Panel — Epic 3 Demo</h1>

      <section className="border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">US-013 · PDF Upload &amp; Auto-Index</h2>
        <PdfUpload onUpload={handleUpload} ingestionState={ingestionState} />
      </section>

      <section className="border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">US-014 · Unit Availability Management</h2>
        <UnitStatusManager
          units={units}
          onStatusChange={handleStatusChange}
          onBulkUpload={() => {}}
        />
      </section>

      <section className="border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">
          US-015 · Analytics Dashboard &amp; Knowledge Gap Report
        </h2>
        <AnalyticsDashboard
          analytics={sampleAnalytics}
          knowledgeGaps={sampleGaps}
          onExportCsv={() => {}}
        />
      </section>
    </div>
  )
}

export default (parentRoute: RootRoute) =>
  createRoute({
    path: '/admin/demo',
    component: AdminDemo,
    getParentRoute: () => parentRoute,
  })

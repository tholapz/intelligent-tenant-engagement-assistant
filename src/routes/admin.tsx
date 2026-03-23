/**
 * Admin Panel — Epic 3: Admin & Knowledge Base Management
 * US-013: Upload & auto-index sales kit PDF
 * US-014: Unit availability management
 * US-015: Analytics dashboard & knowledge gap report
 */
import { useCallback, useRef, useState } from 'react'
import { createRoute } from '@tanstack/react-router'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { RootRoute } from '@tanstack/react-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ─── Types ───────────────────────────────────────────────────────────────────

type UnitStatus = 'available' | 'leased' | 'renovation' | 'reserved'
type IngestionStatus = 'queued' | 'processing' | 'indexed' | 'failed'
type TimePeriod = 'daily' | 'weekly' | 'monthly'

interface Unit {
  unitId: string
  mallName: string
  floor: number
  sizeSqm: number
  zone: string
  baseRent: number
  status: UnitStatus
  updatedAt: string
}

interface IngestionJob {
  id: string
  filename: string
  category: string
  status: IngestionStatus
  chunkCount: number | null
  uploadedAt: string
  errorMessage?: string
}

interface KnowledgeGap {
  query: string
  timestamp: string
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_UNITS: Array<Unit> = [
  {
    unitId: 'CW001-A001',
    mallName: 'CentralWorld',
    floor: 1,
    sizeSqm: 48,
    zone: 'Fashion',
    baseRent: 5200,
    status: 'available',
    updatedAt: '2026-03-21',
  },
  {
    unitId: 'CW001-A002',
    mallName: 'CentralWorld',
    floor: 1,
    sizeSqm: 62,
    zone: 'Fashion',
    baseRent: 5400,
    status: 'leased',
    updatedAt: '2026-03-18',
  },
  {
    unitId: 'CW001-B001',
    mallName: 'CentralWorld',
    floor: 2,
    sizeSqm: 120,
    zone: 'F&B',
    baseRent: 4800,
    status: 'available',
    updatedAt: '2026-03-20',
  },
  {
    unitId: 'CW001-B002',
    mallName: 'CentralWorld',
    floor: 2,
    sizeSqm: 85,
    zone: 'F&B',
    baseRent: 4600,
    status: 'renovation',
    updatedAt: '2026-03-15',
  },
  {
    unitId: 'CW001-C001',
    mallName: 'CentralWorld',
    floor: 3,
    sizeSqm: 55,
    zone: 'Beauty',
    baseRent: 4900,
    status: 'available',
    updatedAt: '2026-03-22',
  },
  {
    unitId: 'CLD001-A001',
    mallName: 'Central Ladprao',
    floor: 1,
    sizeSqm: 45,
    zone: 'Fashion',
    baseRent: 3800,
    status: 'available',
    updatedAt: '2026-03-20',
  },
  {
    unitId: 'CLD001-A002',
    mallName: 'Central Ladprao',
    floor: 1,
    sizeSqm: 70,
    zone: 'Fashion',
    baseRent: 4000,
    status: 'reserved',
    updatedAt: '2026-03-19',
  },
  {
    unitId: 'CLD001-B001',
    mallName: 'Central Ladprao',
    floor: 2,
    sizeSqm: 95,
    zone: 'F&B',
    baseRent: 3600,
    status: 'leased',
    updatedAt: '2026-03-10',
  },
  {
    unitId: 'CLD001-C001',
    mallName: 'Central Ladprao',
    floor: 3,
    sizeSqm: 50,
    zone: 'Electronics',
    baseRent: 3500,
    status: 'available',
    updatedAt: '2026-03-21',
  },
  {
    unitId: 'CR9001-A001',
    mallName: 'Central Rama 9',
    floor: 1,
    sizeSqm: 58,
    zone: 'Fashion',
    baseRent: 4200,
    status: 'available',
    updatedAt: '2026-03-22',
  },
  {
    unitId: 'CR9001-A002',
    mallName: 'Central Rama 9',
    floor: 1,
    sizeSqm: 42,
    zone: 'Fashion',
    baseRent: 4100,
    status: 'leased',
    updatedAt: '2026-03-14',
  },
  {
    unitId: 'CR9001-B001',
    mallName: 'Central Rama 9',
    floor: 2,
    sizeSqm: 110,
    zone: 'Entertainment',
    baseRent: 3900,
    status: 'renovation',
    updatedAt: '2026-03-12',
  },
]

const MOCK_JOBS: Array<IngestionJob> = [
  {
    id: 'job-001',
    filename: 'sales-kit-q1-2026.pdf',
    category: 'sales-kit',
    status: 'indexed',
    chunkCount: 142,
    uploadedAt: '2026-03-20 09:15',
  },
  {
    id: 'job-002',
    filename: 'centralworld-leasing-guide.pdf',
    category: 'leasing-guide',
    status: 'indexed',
    chunkCount: 87,
    uploadedAt: '2026-03-18 14:30',
  },
  {
    id: 'job-003',
    filename: 'faq-general.pdf',
    category: 'faq',
    status: 'indexed',
    chunkCount: 53,
    uploadedAt: '2026-03-15 11:00',
  },
]

const MOCK_DAILY_DATA = [
  { date: 'Mar 16', conversations: 28, leads: 8 },
  { date: 'Mar 17', conversations: 35, leads: 12 },
  { date: 'Mar 18', conversations: 42, leads: 15 },
  { date: 'Mar 19', conversations: 31, leads: 9 },
  { date: 'Mar 20', conversations: 55, leads: 21 },
  { date: 'Mar 21', conversations: 48, leads: 17 },
  { date: 'Mar 22', conversations: 38, leads: 14 },
]

const MOCK_TOP_BUSINESS_TYPES = [
  { name: 'Fashion', count: 89 },
  { name: 'F&B', count: 74 },
  { name: 'Beauty', count: 61 },
  { name: 'Electronics', count: 43 },
  { name: 'Entertainment', count: 38 },
]

const MOCK_TOP_MALLS = [
  { name: 'CentralWorld', count: 112 },
  { name: 'Central Rama 9', count: 78 },
  { name: 'Central Ladprao', count: 65 },
  { name: 'Central Phuket', count: 51 },
  { name: 'Central Chiang Mai', count: 41 },
]

const MOCK_KNOWLEDGE_GAPS: Array<KnowledgeGap> = [
  {
    query: 'What is the penalty for early lease termination?',
    timestamp: '2026-03-22 10:14',
  },
  {
    query: 'Do you accept cryptocurrency payment for deposits?',
    timestamp: '2026-03-22 09:47',
  },
  {
    query: 'Can I sublease my unit to another merchant?',
    timestamp: '2026-03-21 16:33',
  },
  {
    query: 'What are the operating hours during public holidays?',
    timestamp: '2026-03-21 14:05',
  },
  {
    query: 'Is there a grace period for fit-out completion?',
    timestamp: '2026-03-20 11:22',
  },
]

const CATEGORIES = ['sales-kit', 'leasing-guide', 'faq', 'mall-info', 'general']

const STATUS_COLORS: Record<UnitStatus, string> = {
  available: 'bg-green-100 text-green-800',
  leased: 'bg-red-100 text-red-800',
  renovation: 'bg-yellow-100 text-yellow-800',
  reserved: 'bg-blue-100 text-blue-800',
}

const INGESTION_COLORS: Record<IngestionStatus, string> = {
  queued: 'bg-gray-100 text-gray-700',
  processing: 'bg-blue-100 text-blue-700',
  indexed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
}

// ─── US-013: Knowledge Base Tab ───────────────────────────────────────────────

function KnowledgeBaseTab() {
  const [jobs, setJobs] = useState<Array<IngestionJob>>(MOCK_JOBS)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (file.type !== 'application/pdf') return 'Only PDF files are accepted.'
    if (file.size > 20 * 1024 * 1024) return 'File must be under 20 MB.'
    return null
  }

  const handleFileSelect = (file: File) => {
    const error = validateFile(file)
    if (error) {
      setUploadError(error)
      setSelectedFile(null)
      return
    }
    setUploadError(null)
    setSelectedFile(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files.item(0)
    if (file) handleFileSelect(file)
  }, [])

  const simulateIngestion = (jobId: string) => {
    // queued → processing (after 1s) → indexed (after 8s)
    setTimeout(() => {
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: 'processing' } : j)),
      )
      setUploadProgress(40)
    }, 1000)
    setTimeout(() => {
      setUploadProgress(75)
    }, 4000)
    setTimeout(() => {
      const chunks = Math.floor(Math.random() * 120) + 40
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId ? { ...j, status: 'indexed', chunkCount: chunks } : j,
        ),
      )
      setUploadProgress(100)
      setSelectedFile(null)
      setSelectedCategory('')
    }, 8000)
  }

  const handleUpload = () => {
    if (!selectedFile || !selectedCategory) {
      setUploadError('Please select a file and category.')
      return
    }
    const newJob: IngestionJob = {
      id: `job-${Date.now()}`,
      filename: selectedFile.name,
      category: selectedCategory,
      status: 'queued',
      chunkCount: null,
      uploadedAt: new Date()
        .toLocaleString('sv')
        .slice(0, 16)
        .replace('T', ' '),
    }
    setJobs((prev) => [newJob, ...prev])
    setUploadProgress(10)
    simulateIngestion(newJob.id)
  }

  const activeJob = jobs.find(
    (j) => j.status === 'queued' || j.status === 'processing',
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Knowledge Base Document</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {uploadError && (
            <Alert variant="destructive">
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}

          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              dragOver
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFileSelect(f)
              }}
            />
            {selectedFile ? (
              <div>
                <p className="font-medium text-gray-800">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div>
                <p className="text-gray-600">
                  Drag & drop a PDF here, or click to browse
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  PDF only · max 20 MB
                </p>
              </div>
            )}
          </div>

          {/* Category + Upload */}
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Category
              </label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category…" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !selectedCategory || !!activeJob}
            >
              Upload & Index
            </Button>
          </div>

          {/* Ingestion progress */}
          {activeJob && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm text-gray-600">
                <span>
                  Indexing <strong>{activeJob.filename}</strong>…
                </span>
                <span className="capitalize">{activeJob.status}</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Indexed documents table */}
      <Card>
        <CardHeader>
          <CardTitle>Indexed Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Filename</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Chunks</TableHead>
                <TableHead>Uploaded</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.filename}</TableCell>
                  <TableCell>{job.category}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${INGESTION_COLORS[job.status]}`}
                    >
                      {job.status}
                      {job.status === 'processing' && '…'}
                    </span>
                  </TableCell>
                  <TableCell>{job.chunkCount ?? '—'}</TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {job.uploadedAt}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── US-014: Unit Management Tab ──────────────────────────────────────────────

function UnitManagementTab() {
  const [units, setUnits] = useState<Array<Unit>>(MOCK_UNITS)
  const [filterMall, setFilterMall] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [dialogUnit, setDialogUnit] = useState<Unit | null>(null)
  const [newStatus, setNewStatus] = useState<UnitStatus>('available')
  const [csvError, setCsvError] = useState<string | null>(null)
  const [csvSuccess, setCsvSuccess] = useState<string | null>(null)
  const csvInputRef = useRef<HTMLInputElement>(null)

  const malls = ['all', ...Array.from(new Set(units.map((u) => u.mallName)))]

  const filtered = units.filter((u) => {
    if (filterMall !== 'all' && u.mallName !== filterMall) return false
    if (filterStatus !== 'all' && u.status !== filterStatus) return false
    return true
  })

  const openDialog = (unit: Unit) => {
    setDialogUnit(unit)
    setNewStatus(unit.status)
  }

  const confirmStatusChange = () => {
    if (!dialogUnit) return
    const now = new Date().toISOString().slice(0, 10)
    setUnits((prev) =>
      prev.map((u) =>
        u.unitId === dialogUnit.unitId
          ? { ...u, status: newStatus, updatedAt: now }
          : u,
      ),
    )
    // In production: PATCH /api/v1/admin/units/{unitId} + write audit log to Firestore
    setDialogUnit(null)
  }

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCsvError(null)
    setCsvSuccess(null)
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const lines = text.trim().split('\n').slice(1) // skip header
      const updates: Array<{ unitId: string; status: UnitStatus }> = []
      const validStatuses = ['available', 'leased', 'renovation', 'reserved']

      for (const line of lines) {
        const [unitId, status] = line.split(',').map((s) => s.trim())
        if (!unitId || !validStatuses.includes(status)) {
          setCsvError(`Invalid row: "${line}". Expected format: unitId,status`)
          return
        }
        updates.push({ unitId, status: status as UnitStatus })
      }

      const now = new Date().toISOString().slice(0, 10)
      setUnits((prev) =>
        prev.map((u) => {
          const upd = updates.find((x) => x.unitId === u.unitId)
          return upd ? { ...u, status: upd.status, updatedAt: now } : u
        }),
      )
      setCsvSuccess(`Applied ${updates.length} status update(s) successfully.`)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="space-y-6">
      {/* Filters + bulk actions */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3">
          <Select value={filterMall} onValueChange={setFilterMall}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All malls" />
            </SelectTrigger>
            <SelectContent>
              {malls.map((m) => (
                <SelectItem key={m} value={m}>
                  {m === 'all' ? 'All malls' : m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="leased">Leased</SelectItem>
              <SelectItem value="renovation">Renovation</SelectItem>
              <SelectItem value="reserved">Reserved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleCsvUpload}
          />
          <Button
            variant="outline"
            onClick={() => csvInputRef.current?.click()}
          >
            Bulk CSV Upload
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const header = 'Unit ID,Status (example)'
              const rows = filtered.map((u) => `${u.unitId},${u.status}`)
              const blob = new Blob([[header, ...rows].join('\n')], {
                type: 'text/csv',
              })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'units-template.csv'
              a.click()
              URL.revokeObjectURL(url)
            }}
          >
            Download Template
          </Button>
        </div>
      </div>

      {csvError && (
        <Alert variant="destructive">
          <AlertDescription>{csvError}</AlertDescription>
        </Alert>
      )}
      {csvSuccess && (
        <Alert>
          <AlertDescription>{csvSuccess}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit ID</TableHead>
                <TableHead>Mall</TableHead>
                <TableHead>Floor</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Rent (THB/sqm/mo)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((unit) => (
                <TableRow key={unit.unitId}>
                  <TableCell className="font-mono text-sm">
                    {unit.unitId}
                  </TableCell>
                  <TableCell>{unit.mallName}</TableCell>
                  <TableCell>{unit.floor}</TableCell>
                  <TableCell>{unit.sizeSqm} sqm</TableCell>
                  <TableCell>{unit.zone}</TableCell>
                  <TableCell>{unit.baseRent.toLocaleString()}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[unit.status]}`}
                    >
                      {unit.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {unit.updatedAt}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openDialog(unit)}
                    >
                      Change Status
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-sm text-gray-500 mt-2">
            {filtered.length} of {units.length} units
          </p>
        </CardContent>
      </Card>

      {/* Status change dialog */}
      <Dialog
        open={!!dialogUnit}
        onOpenChange={(open) => {
          if (!open) setDialogUnit(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Unit Status — {dialogUnit?.unitId}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <p className="text-sm text-gray-600">
              Current status:{' '}
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${dialogUnit ? STATUS_COLORS[dialogUnit.status] : ''}`}
              >
                {dialogUnit?.status}
              </span>
            </p>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                New status
              </label>
              <Select
                value={newStatus}
                onValueChange={(v) => setNewStatus(v as UnitStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="leased">Leased</SelectItem>
                  <SelectItem value="renovation">Renovation</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogUnit(null)}>
              Cancel
            </Button>
            <Button
              onClick={confirmStatusChange}
              disabled={newStatus === dialogUnit?.status}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── US-015: Analytics Tab ────────────────────────────────────────────────────

function AnalyticsTab() {
  const [period, setPeriod] = useState<TimePeriod>('daily')

  const totalConversations = MOCK_DAILY_DATA.reduce(
    (s, d) => s + d.conversations,
    0,
  )
  const totalLeads = MOCK_DAILY_DATA.reduce((s, d) => s + d.leads, 0)
  const conversionRate = ((totalLeads / totalConversations) * 100).toFixed(1)
  const avgLeadScore = 68

  const exportCsv = () => {
    const rows = [
      'Date,Conversations,Leads',
      ...MOCK_DAILY_DATA.map((d) => `${d.date},${d.conversations},${d.leads}`),
    ]
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${period}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Time period + export */}
      <div className="flex items-center justify-between">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as TimePeriod)}>
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" onClick={exportCsv}>
          Export CSV
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Conversations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalConversations}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-gray-500">
              Leads Captured
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalLeads}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-gray-500">
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{conversionRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-gray-500">
              Avg Lead Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{avgLeadScore}</p>
          </CardContent>
        </Card>
      </div>

      {/* Conversations over time */}
      <Card>
        <CardHeader>
          <CardTitle>Conversations & Leads Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={MOCK_DAILY_DATA}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="conversations"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Conversations"
              />
              <Line
                type="monotone"
                dataKey="leads"
                stroke="#10b981"
                strokeWidth={2}
                name="Leads"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top-5 charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Business Types</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={MOCK_TOP_BUSINESS_TYPES} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 12 }}
                  width={90}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" name="Queries" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 Queried Malls</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={MOCK_TOP_MALLS} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 12 }}
                  width={110}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" name="Queries" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Knowledge gap report */}
      <Card>
        <CardHeader>
          <CardTitle>Knowledge Gap Report</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-3">
            Queries where the chatbot returned a fallback response — indicating
            missing knowledge base content.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Query</TableHead>
                <TableHead className="w-40">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_KNOWLEDGE_GAPS.map((gap, i) => (
                <TableRow key={i}>
                  <TableCell>{gap.query}</TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {gap.timestamp}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Admin Page ───────────────────────────────────────────────────────────────

function AdminPage() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage knowledge base, unit availability, and monitor system
          analytics.
        </p>
      </div>

      <Tabs defaultValue="knowledge-base">
        <TabsList className="mb-6">
          <TabsTrigger value="knowledge-base">Knowledge Base</TabsTrigger>
          <TabsTrigger value="units">Unit Availability</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="knowledge-base">
          <KnowledgeBaseTab />
        </TabsContent>

        <TabsContent value="units">
          <UnitManagementTab />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Route factory ────────────────────────────────────────────────────────────

export default (parentRoute: RootRoute) =>
  createRoute({
    path: '/admin',
    component: AdminPage,
    getParentRoute: () => parentRoute,
  })

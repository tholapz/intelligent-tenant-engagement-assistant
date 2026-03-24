import { describe, expect, test, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  AnalyticsDashboard,
  type AnalyticsData,
  type KnowledgeGapEntry,
} from './AnalyticsDashboard'

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
  { conversationId: 'conv-1', query: 'What is the CAM fee?', timestamp: '2026-03-22T08:00:00Z' },
  { conversationId: 'conv-2', query: 'Do you allow food trucks?', timestamp: '2026-03-22T09:00:00Z' },
]

// US-015 — Analytics dashboard & knowledge gap report

describe('AnalyticsDashboard', () => {
  // AC-M: Dashboard displays conversation metrics, leads, conversion, avg score, top types & malls
  test('renders daily, weekly, monthly conversation counts', () => {
    render(
      <AnalyticsDashboard
        analytics={sampleAnalytics}
        knowledgeGaps={[]}
        onExportCsv={vi.fn()}
      />,
    )
    expect(screen.getByTestId('metric-conversations-daily').textContent).toMatch(/12/)
    expect(screen.getByTestId('metric-conversations-weekly').textContent).toMatch(/74/)
    expect(screen.getByTestId('metric-conversations-monthly').textContent).toMatch(/310/)
  })

  test('renders leads captured count', () => {
    render(
      <AnalyticsDashboard
        analytics={sampleAnalytics}
        knowledgeGaps={[]}
        onExportCsv={vi.fn()}
      />,
    )
    expect(screen.getByTestId('metric-leads').textContent).toMatch(/28/)
  })

  test('renders lead conversion rate as percentage', () => {
    render(
      <AnalyticsDashboard
        analytics={sampleAnalytics}
        knowledgeGaps={[]}
        onExportCsv={vi.fn()}
      />,
    )
    expect(screen.getByTestId('metric-conversion-rate').textContent).toMatch(/9\.0%/)
  })

  test('renders average lead score', () => {
    render(
      <AnalyticsDashboard
        analytics={sampleAnalytics}
        knowledgeGaps={[]}
        onExportCsv={vi.fn()}
      />,
    )
    expect(screen.getByTestId('metric-avg-lead-score').textContent).toMatch(/67/)
  })

  test('renders top 5 business types', () => {
    render(
      <AnalyticsDashboard
        analytics={sampleAnalytics}
        knowledgeGaps={[]}
        onExportCsv={vi.fn()}
      />,
    )
    const list = screen.getByTestId('top-business-types')
    expect(list.children.length).toBe(5)
    expect(list.textContent).toMatch(/Restaurant/)
    expect(list.textContent).toMatch(/Cafe/)
  })

  test('renders top 5 malls', () => {
    render(
      <AnalyticsDashboard
        analytics={sampleAnalytics}
        knowledgeGaps={[]}
        onExportCsv={vi.fn()}
      />,
    )
    const list = screen.getByTestId('top-malls')
    expect(list.children.length).toBe(5)
    expect(list.textContent).toMatch(/Central World/)
    expect(list.textContent).toMatch(/Central Rama 9/)
  })

  // AC-N: Knowledge gap report lists fallback conversations with original query
  test('renders knowledge gap entries with user queries', () => {
    render(
      <AnalyticsDashboard
        analytics={sampleAnalytics}
        knowledgeGaps={sampleGaps}
        onExportCsv={vi.fn()}
      />,
    )
    expect(screen.getByTestId('gap-conv-1').textContent).toMatch(/CAM fee/)
    expect(screen.getByTestId('gap-conv-2').textContent).toMatch(/food trucks/)
  })

  test('shows empty state when no knowledge gaps', () => {
    render(
      <AnalyticsDashboard
        analytics={sampleAnalytics}
        knowledgeGaps={[]}
        onExportCsv={vi.fn()}
      />,
    )
    expect(screen.getByTestId('no-gaps')).toBeDefined()
  })

  // AC-P: Export dashboard data as CSV
  test('renders export CSV button', () => {
    render(
      <AnalyticsDashboard
        analytics={sampleAnalytics}
        knowledgeGaps={[]}
        onExportCsv={vi.fn()}
      />,
    )
    expect(screen.getByTestId('export-csv-btn')).toBeDefined()
  })

  test('calls onExportCsv when export button is clicked', () => {
    const onExportCsv = vi.fn()
    render(
      <AnalyticsDashboard
        analytics={sampleAnalytics}
        knowledgeGaps={[]}
        onExportCsv={onExportCsv}
      />,
    )
    fireEvent.click(screen.getByTestId('export-csv-btn'))
    expect(onExportCsv).toHaveBeenCalledOnce()
  })
})

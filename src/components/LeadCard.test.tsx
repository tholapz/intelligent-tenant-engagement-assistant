import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LeadCard } from './LeadCard'
import type { Lead } from '@/types'

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

function makeTimestamp(date = new Date()) {
  return { toDate: () => date } as unknown as import('firebase/firestore').Timestamp
}

const baseLead: Lead = {
  id: 'lead-001',
  prospectName: 'Somchai Jaidee',
  contact: 'somchai@example.com',
  businessType: 'Food & Beverage',
  mallPreference: ['Central World', 'Central Bangna'],
  leadScore: 50,
  status: 'new',
  createdAt: makeTimestamp(),
  updatedAt: makeTimestamp(),
  sessionId: 'session-abc',
}

describe('LeadCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // US-008 AC-F: each lead card displays required fields
  it('renders prospect name, contact, business type, score, and status', () => {
    render(<LeadCard lead={baseLead} />)

    expect(screen.getByText('Somchai Jaidee')).toBeDefined()
    expect(screen.getByText('somchai@example.com')).toBeDefined()
    expect(screen.getByText('Food & Beverage')).toBeDefined()
    expect(screen.getByText('50')).toBeDefined()
    expect(screen.getByText('New')).toBeDefined()
  })

  // US-008 AC-F: displays mall preferences
  it('renders mall preference chips', () => {
    render(<LeadCard lead={baseLead} />)
    expect(screen.getByText('Central World')).toBeDefined()
    expect(screen.getByText('Central Bangna')).toBeDefined()
  })

  // US-008 AC-G: leads with score ≥75 highlighted with badge
  it('shows High Priority badge when lead score is exactly 75', () => {
    render(<LeadCard lead={{ ...baseLead, leadScore: 75 }} />)
    expect(screen.getAllByText('⭐ High Priority').length).toBeGreaterThanOrEqual(1)
  })

  it('shows High Priority badge when lead score is above 75', () => {
    render(<LeadCard lead={{ ...baseLead, leadScore: 92 }} />)
    expect(screen.getAllByText('⭐ High Priority').length).toBeGreaterThanOrEqual(1)
  })

  it('does NOT show High Priority badge when lead score is below 75', () => {
    render(<LeadCard lead={{ ...baseLead, leadScore: 74 }} />)
    expect(screen.queryByText('⭐ High Priority')).toBeNull()
  })

  // US-008 AC-F: status labels rendered correctly
  it.each([
    ['contacted', 'Contacted'],
    ['site_visit_scheduled', 'Site Visit'],
    ['proposal_sent', 'Proposal Sent'],
    ['closed_won', 'Closed Won'],
    ['closed_lost', 'Closed Lost'],
  ] as const)('renders status label "%s" as "%s"', (status, label) => {
    render(<LeadCard lead={{ ...baseLead, status }} />)
    expect(screen.getByText(label)).toBeDefined()
  })

  // US-008 AC-F: time since creation displayed
  it('renders relative time since creation', () => {
    const oldDate = new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
    render(<LeadCard lead={{ ...baseLead, createdAt: makeTimestamp(oldDate) }} />)
    // dayjs fromNow produces something like "3 hours ago"
    expect(screen.getByText(/ago/i)).toBeDefined()
  })

  // Clicking navigates to lead detail
  it('navigates to lead detail page on click', () => {
    render(<LeadCard lead={baseLead} />)
    fireEvent.click(screen.getByRole('button'))
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/agent/leads/$leadId',
      params: { leadId: 'lead-001' },
    })
  })

  // Amber border for high-priority
  it('applies amber border class for high-priority leads', () => {
    const { container } = render(
      <LeadCard lead={{ ...baseLead, leadScore: 80 }} />,
    )
    const button = container.querySelector('button')
    expect(button?.className).toContain('border-amber-400')
  })

  it('does NOT apply amber border for normal leads', () => {
    const { container } = render(
      <LeadCard lead={{ ...baseLead, leadScore: 60 }} />,
    )
    const button = container.querySelector('button')
    expect(button?.className).not.toContain('border-amber-400')
  })
})

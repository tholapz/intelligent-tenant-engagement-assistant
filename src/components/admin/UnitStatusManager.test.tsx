import { describe, expect, test, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { UnitStatusManager, type Unit } from './UnitStatusManager'

const sampleUnits: Unit[] = [
  {
    unitId: 'U001',
    name: 'Shop A-01',
    status: 'available',
    auditLog: [],
  },
  {
    unitId: 'U002',
    name: 'Shop B-02',
    status: 'leased',
    auditLog: [
      {
        changedByUid: 'user-123',
        timestamp: '2026-03-20T10:00:00Z',
        fromStatus: 'available',
        toStatus: 'leased',
      },
    ],
  },
]

// US-014 — Unit availability management

describe('UnitStatusManager', () => {
  // AC-I: Admin updates units/{unitId}.status
  test('renders all units in the table', () => {
    render(
      <UnitStatusManager
        units={sampleUnits}
        onStatusChange={vi.fn()}
        onBulkUpload={vi.fn()}
      />,
    )
    expect(screen.getByTestId('unit-row-U001')).toBeDefined()
    expect(screen.getByTestId('unit-row-U002')).toBeDefined()
  })

  test('shows current unit status in dropdown', () => {
    render(
      <UnitStatusManager
        units={sampleUnits}
        onStatusChange={vi.fn()}
        onBulkUpload={vi.fn()}
      />,
    )
    const select = screen.getByRole('combobox', {
      name: /status for shop a-01/i,
    }) as HTMLSelectElement
    expect(select.value).toBe('available')
  })

  test('calls onStatusChange when status is updated', () => {
    const onStatusChange = vi.fn()
    render(
      <UnitStatusManager
        units={sampleUnits}
        onStatusChange={onStatusChange}
        onBulkUpload={vi.fn()}
      />,
    )
    const select = screen.getByRole('combobox', { name: /status for shop a-01/i })
    fireEvent.change(select, { target: { value: 'leased' } })

    expect(onStatusChange).toHaveBeenCalledWith('U001', 'leased')
  })

  test('supports all valid status options (leased, renovation, reserved)', () => {
    render(
      <UnitStatusManager
        units={sampleUnits}
        onStatusChange={vi.fn()}
        onBulkUpload={vi.fn()}
      />,
    )
    const select = screen.getByRole('combobox', { name: /status for shop a-01/i })
    const options = Array.from((select as HTMLSelectElement).options).map(
      (o) => o.value,
    )
    expect(options).toContain('leased')
    expect(options).toContain('renovation')
    expect(options).toContain('reserved')
    expect(options).toContain('available')
  })

  // AC-K: Status change logged in audit_log
  test('renders audit log entries for a unit', () => {
    render(
      <UnitStatusManager
        units={sampleUnits}
        onStatusChange={vi.fn()}
        onBulkUpload={vi.fn()}
      />,
    )
    const auditLog = screen.getByTestId('audit-log-U002')
    expect(auditLog.textContent).toMatch(/available → leased/)
    expect(auditLog.textContent).toMatch(/user-123/)
  })

  test('renders empty audit log when no history', () => {
    render(
      <UnitStatusManager
        units={sampleUnits}
        onStatusChange={vi.fn()}
        onBulkUpload={vi.fn()}
      />,
    )
    const auditLog = screen.getByTestId('audit-log-U001')
    expect(auditLog.children.length).toBe(0)
  })

  // AC-L: Bulk update via CSV upload
  test('renders bulk upload CSV button', () => {
    render(
      <UnitStatusManager
        units={sampleUnits}
        onStatusChange={vi.fn()}
        onBulkUpload={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /bulk upload csv/i })).toBeDefined()
  })

  test('calls onBulkUpload when CSV file is selected', () => {
    const onBulkUpload = vi.fn()
    render(
      <UnitStatusManager
        units={sampleUnits}
        onStatusChange={vi.fn()}
        onBulkUpload={onBulkUpload}
      />,
    )
    const csvInput = screen.getByTestId('csv-input')
    const file = new File(['U001,leased\nU002,available'], 'units.csv', {
      type: 'text/csv',
    })
    fireEvent.change(csvInput, { target: { files: [file] } })

    expect(onBulkUpload).toHaveBeenCalledWith(file)
  })
})

import { describe, expect, test, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PdfUpload, type IngestionState } from './PdfUpload'

const idleState: IngestionState = { status: 'idle' }

function makePdfFile(sizeBytes: number) {
  return new File([new ArrayBuffer(sizeBytes)], 'test.pdf', {
    type: 'application/pdf',
  })
}

// US-013 — Upload & auto-index sales kit PDF

describe('PdfUpload', () => {
  // AC-C: Admin uploads PDF via the Admin panel (max 20 MB, PDF only)
  test('renders upload button', () => {
    render(<PdfUpload onUpload={vi.fn()} ingestionState={idleState} />)
    expect(screen.getByRole('button', { name: /upload pdf/i })).toBeDefined()
  })

  test('calls onUpload with valid PDF file under 20 MB', () => {
    const onUpload = vi.fn().mockResolvedValue(undefined)
    render(<PdfUpload onUpload={onUpload} ingestionState={idleState} />)

    const input = screen.getByTestId('pdf-input')
    const file = makePdfFile(1 * 1024 * 1024) // 1 MB
    fireEvent.change(input, { target: { files: [file] } })

    expect(onUpload).toHaveBeenCalledWith(file)
  })

  test('rejects non-PDF file', () => {
    const onUpload = vi.fn()
    render(<PdfUpload onUpload={onUpload} ingestionState={idleState} />)

    const input = screen.getByTestId('pdf-input')
    const file = new File(['data'], 'doc.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    fireEvent.change(input, { target: { files: [file] } })

    expect(onUpload).not.toHaveBeenCalled()
    expect(screen.getByTestId('validation-error').textContent).toMatch(/only pdf/i)
  })

  test('rejects PDF file exceeding 20 MB', () => {
    const onUpload = vi.fn()
    render(<PdfUpload onUpload={onUpload} ingestionState={idleState} />)

    const input = screen.getByTestId('pdf-input')
    const file = makePdfFile(21 * 1024 * 1024) // 21 MB
    fireEvent.change(input, { target: { files: [file] } })

    expect(onUpload).not.toHaveBeenCalled()
    expect(screen.getByTestId('validation-error').textContent).toMatch(/20 mb/i)
  })

  // AC-F: Ingestion status shown in UI: queued → processing → indexed (with chunk count)
  test('shows "queued" status', () => {
    render(
      <PdfUpload onUpload={vi.fn()} ingestionState={{ status: 'queued' }} />,
    )
    expect(screen.getByTestId('ingestion-status').textContent).toMatch(/queued/)
  })

  test('shows "processing" status', () => {
    render(
      <PdfUpload onUpload={vi.fn()} ingestionState={{ status: 'processing' }} />,
    )
    expect(screen.getByTestId('ingestion-status').textContent).toMatch(/processing/)
  })

  test('shows "indexed" status with chunk count', () => {
    render(
      <PdfUpload
        onUpload={vi.fn()}
        ingestionState={{ status: 'indexed', chunkCount: 42 }}
      />,
    )
    const status = screen.getByTestId('ingestion-status')
    expect(status.textContent).toMatch(/indexed/)
    expect(status.textContent).toMatch(/42/)
  })

  // AC-H: On failure, admin receives error notification
  test('shows error notification on ingestion failure', () => {
    render(
      <PdfUpload
        onUpload={vi.fn()}
        ingestionState={{
          status: 'error',
          errorMessage: 'Ingestion failed: timeout',
        }}
      />,
    )
    const error = screen.getByTestId('ingestion-error')
    expect(error.textContent).toMatch(/ingestion failed/i)
  })

  test('disables upload button while processing', () => {
    render(
      <PdfUpload onUpload={vi.fn()} ingestionState={{ status: 'processing' }} />,
    )
    const btn = screen.getByRole('button', { name: /upload pdf/i }) as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  test('disables upload button while queued', () => {
    render(
      <PdfUpload onUpload={vi.fn()} ingestionState={{ status: 'queued' }} />,
    )
    const btn = screen.getByRole('button', { name: /upload pdf/i }) as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })
})

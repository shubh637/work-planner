import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import SuggestTask from '../member/SuggestTask'
import { AuthProvider } from '../../context/AuthContext'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../../api/api', () => ({
  taskApi: { suggest: vi.fn() },
  projectApi: { getAll: vi.fn() },
}))

import { taskApi, projectApi } from '../../api/api'

const PROJECTS = [
  { id: 1, name: 'Alpha' },
  { id: 2, name: 'Beta' },
]

function renderSuggestTask() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <SuggestTask />
      </AuthProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  projectApi.getAll.mockResolvedValue({ data: PROJECTS })
})

// ── field attributes ──────────────────────────────────────────────────────────

describe('SuggestTask — field attributes', () => {
  it('task title is required', async () => {
    renderSuggestTask()
    await waitFor(() => screen.getByLabelText(/task title/i))
    expect(screen.getByLabelText(/task title/i)).toBeRequired()
  })

  it('project select is required', async () => {
    renderSuggestTask()
    await waitFor(() => screen.getByLabelText(/project/i))
    expect(screen.getByLabelText(/project/i)).toBeRequired()
  })

  it('description is NOT required', async () => {
    renderSuggestTask()
    await waitFor(() => screen.getByLabelText(/description/i))
    expect(screen.getByLabelText(/description/i)).not.toBeRequired()
  })

  it('due date is NOT required', async () => {
    renderSuggestTask()
    await waitFor(() => screen.getByLabelText(/due date/i))
    expect(screen.getByLabelText(/due date/i)).not.toBeRequired()
  })

  it('due date input has type=date', async () => {
    renderSuggestTask()
    await waitFor(() => screen.getByLabelText(/due date/i))
    expect(screen.getByLabelText(/due date/i)).toHaveAttribute('type', 'date')
  })

  it('populates project dropdown from API', async () => {
    renderSuggestTask()
    await waitFor(() => expect(screen.getByText('Alpha')).toBeInTheDocument())
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })
})

// ── submission ────────────────────────────────────────────────────────────────

describe('SuggestTask — submission', () => {
  it('shows success message after submit', async () => {
    taskApi.suggest.mockResolvedValue({})
    renderSuggestTask()
    await waitFor(() => screen.getByLabelText(/task title/i))
    await userEvent.type(screen.getByLabelText(/task title/i), 'My Task')
    await userEvent.selectOptions(screen.getByLabelText(/project/i), '1')
    await userEvent.click(screen.getByRole('button', { name: /submit suggestion/i }))
    await waitFor(() =>
      expect(screen.getByText(/awaiting manager approval/i)).toBeInTheDocument()
    )
  })

  it('resets form fields after successful submission', async () => {
    taskApi.suggest.mockResolvedValue({})
    renderSuggestTask()
    await waitFor(() => screen.getByLabelText(/task title/i))
    await userEvent.type(screen.getByLabelText(/task title/i), 'My Task')
    await userEvent.selectOptions(screen.getByLabelText(/project/i), '1')
    await userEvent.click(screen.getByRole('button', { name: /submit suggestion/i }))
    await waitFor(() =>
      expect(screen.getByLabelText(/task title/i)).toHaveValue('')
    )
  })

  it('sends null for dueDate when left empty', async () => {
    taskApi.suggest.mockResolvedValue({})
    renderSuggestTask()
    await waitFor(() => screen.getByLabelText(/task title/i))
    await userEvent.type(screen.getByLabelText(/task title/i), 'No Due Date Task')
    await userEvent.selectOptions(screen.getByLabelText(/project/i), '2')
    await userEvent.click(screen.getByRole('button', { name: /submit suggestion/i }))
    await waitFor(() =>
      expect(taskApi.suggest).toHaveBeenCalledWith(
        expect.objectContaining({ dueDate: null })
      )
    )
  })

  it('sends projectId as a number, not a string', async () => {
    taskApi.suggest.mockResolvedValue({})
    renderSuggestTask()
    await waitFor(() => screen.getByLabelText(/task title/i))
    await userEvent.type(screen.getByLabelText(/task title/i), 'Task')
    await userEvent.selectOptions(screen.getByLabelText(/project/i), '1')
    await userEvent.click(screen.getByRole('button', { name: /submit suggestion/i }))
    await waitFor(() =>
      expect(taskApi.suggest).toHaveBeenCalledWith(
        expect.objectContaining({ projectId: 1 })
      )
    )
  })

  it('shows error on API failure', async () => {
    taskApi.suggest.mockRejectedValue({
      response: { data: { message: 'Project not found' } },
    })
    renderSuggestTask()
    await waitFor(() => screen.getByLabelText(/task title/i))
    await userEvent.type(screen.getByLabelText(/task title/i), 'Task')
    await userEvent.selectOptions(screen.getByLabelText(/project/i), '1')
    await userEvent.click(screen.getByRole('button', { name: /submit suggestion/i }))
    await waitFor(() =>
      expect(screen.getByText('Project not found')).toBeInTheDocument()
    )
  })

  it('falls back to generic error when API fails without message', async () => {
    taskApi.suggest.mockRejectedValue({ response: {} })
    renderSuggestTask()
    await waitFor(() => screen.getByLabelText(/task title/i))
    await userEvent.type(screen.getByLabelText(/task title/i), 'Task')
    await userEvent.selectOptions(screen.getByLabelText(/project/i), '1')
    await userEvent.click(screen.getByRole('button', { name: /submit suggestion/i }))
    await waitFor(() =>
      expect(screen.getByText(/failed to submit suggestion/i)).toBeInTheDocument()
    )
  })

  it('navigates back when Cancel is clicked', async () => {
    renderSuggestTask()
    await waitFor(() => screen.getByRole('button', { name: /cancel/i }))
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })
})

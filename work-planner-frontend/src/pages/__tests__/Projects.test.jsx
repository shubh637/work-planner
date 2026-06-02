import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import Projects from '../manager/Projects'
import { AuthProvider } from '../../context/AuthContext'

vi.mock('../../api/api', () => ({
  projectApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}))

import { projectApi } from '../../api/api'

const PROJECTS = [
  { id: 1, name: 'Alpha', description: 'First project' },
  { id: 2, name: 'Beta', description: '' },
]

function renderProjects() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Projects />
      </AuthProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  projectApi.getAll.mockResolvedValue({ data: PROJECTS })
})

// ── rendering ─────────────────────────────────────────────────────────────────

describe('Projects — rendering', () => {
  it('renders all project cards', async () => {
    renderProjects()
    await waitFor(() => expect(screen.getByText('Alpha')).toBeInTheDocument())
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })

  it('shows empty state when there are no projects', async () => {
    projectApi.getAll.mockResolvedValue({ data: [] })
    renderProjects()
    await waitFor(() =>
      expect(screen.getByText(/no projects yet/i)).toBeInTheDocument()
    )
  })

  it('shows "No description" fallback for empty description', async () => {
    renderProjects()
    await waitFor(() => expect(screen.getByText('Beta')).toBeInTheDocument())
    expect(screen.getByText(/no description/i)).toBeInTheDocument()
  })
})

// ── create project ────────────────────────────────────────────────────────────

describe('Projects — create', () => {
  it('opens modal when New Project is clicked', async () => {
    renderProjects()
    await waitFor(() => screen.getByText('Alpha'))
    await userEvent.click(screen.getByRole('button', { name: /new project/i }))
    expect(screen.getByText(/new project/i, { selector: '.modal-title' })).toBeInTheDocument()
  })

  it('project name field is required', async () => {
    renderProjects()
    await waitFor(() => screen.getByText('Alpha'))
    await userEvent.click(screen.getByRole('button', { name: /new project/i }))
    expect(screen.getByLabelText(/project name/i)).toBeRequired()
  })

  it('description field is NOT required', async () => {
    renderProjects()
    await waitFor(() => screen.getByText('Alpha'))
    await userEvent.click(screen.getByRole('button', { name: /new project/i }))
    expect(screen.getByLabelText(/^description/i)).not.toBeRequired()
  })

  it('calls create with correct values and refreshes', async () => {
    projectApi.create.mockResolvedValue({})
    renderProjects()
    await waitFor(() => screen.getByText('Alpha'))
    await userEvent.click(screen.getByRole('button', { name: /new project/i }))
    await userEvent.type(screen.getByLabelText(/project name/i), 'Gamma')
    await userEvent.type(screen.getByLabelText(/^description/i), 'Third project')
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }))
    await waitFor(() =>
      expect(projectApi.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Gamma', description: 'Third project' })
      )
    )
    expect(projectApi.getAll).toHaveBeenCalledTimes(2)
  })

  it('shows server error when create fails', async () => {
    projectApi.create.mockRejectedValue({
      response: { data: { message: 'Duplicate project name' } },
    })
    renderProjects()
    await waitFor(() => screen.getByText('Alpha'))
    await userEvent.click(screen.getByRole('button', { name: /new project/i }))
    await userEvent.type(screen.getByLabelText(/project name/i), 'Alpha')
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }))
    await waitFor(() =>
      expect(screen.getByText('Duplicate project name')).toBeInTheDocument()
    )
  })

  it('falls back to generic error when create fails without message', async () => {
    projectApi.create.mockRejectedValue({ response: {} })
    renderProjects()
    await waitFor(() => screen.getByText('Alpha'))
    await userEvent.click(screen.getByRole('button', { name: /new project/i }))
    await userEvent.type(screen.getByLabelText(/project name/i), 'Test')
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }))
    await waitFor(() =>
      expect(screen.getByText(/failed to save project/i)).toBeInTheDocument()
    )
  })

  it('closes modal on Cancel', async () => {
    renderProjects()
    await waitFor(() => screen.getByText('Alpha'))
    await userEvent.click(screen.getByRole('button', { name: /new project/i }))
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByText(/new project/i, { selector: '.modal-title' })).not.toBeInTheDocument()
  })
})

// ── edit project ──────────────────────────────────────────────────────────────

describe('Projects — edit', () => {
  it('pre-fills the form with existing project data', async () => {
    renderProjects()
    await waitFor(() => screen.getByText('Alpha'))
    const cards = screen.getAllByRole('button', { name: /edit/i })
    await userEvent.click(cards[0])
    expect(screen.getByLabelText(/project name/i)).toHaveValue('Alpha')
    expect(screen.getByLabelText(/^description/i)).toHaveValue('First project')
  })

  it('calls update with project id and updated values', async () => {
    projectApi.update.mockResolvedValue({})
    renderProjects()
    await waitFor(() => screen.getByText('Alpha'))
    await userEvent.click(screen.getAllByRole('button', { name: /edit/i })[0])
    await userEvent.clear(screen.getByLabelText(/project name/i))
    await userEvent.type(screen.getByLabelText(/project name/i), 'Alpha v2')
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }))
    await waitFor(() =>
      expect(projectApi.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ name: 'Alpha v2' })
      )
    )
  })
})

// ── delete project ────────────────────────────────────────────────────────────

describe('Projects — delete', () => {
  it('shows confirm modal with warning about associated tasks', async () => {
    renderProjects()
    await waitFor(() => screen.getByText('Alpha'))
    await userEvent.click(screen.getAllByRole('button', { name: /delete/i })[0])
    expect(screen.getByText(/all associated tasks will be removed/i)).toBeInTheDocument()
  })

  it('calls remove and refreshes when confirmed', async () => {
    projectApi.remove.mockResolvedValue({})
    renderProjects()
    await waitFor(() => screen.getByText('Alpha'))
    await userEvent.click(screen.getAllByRole('button', { name: /delete/i })[0])
    await userEvent.click(screen.getByRole('button', { name: /confirm/i }))
    await waitFor(() => expect(projectApi.remove).toHaveBeenCalledWith(1))
    expect(projectApi.getAll).toHaveBeenCalledTimes(2)
  })

  it('does not call remove when Cancel is clicked', async () => {
    renderProjects()
    await waitFor(() => screen.getByText('Alpha'))
    await userEvent.click(screen.getAllByRole('button', { name: /delete/i })[0])
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(projectApi.remove).not.toHaveBeenCalled()
  })
})

import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import TeamMembers from '../manager/TeamMembers'
import { AuthProvider } from '../../context/AuthContext'

vi.mock('../../api/api', () => ({
  userApi: {
    getAll: vi.fn(),
    addMember: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}))

import { userApi } from '../../api/api'

const MEMBERS = [
  { id: 1, name: 'Alice', email: 'alice@test.com', role: 'MANAGER', active: true },
  { id: 2, name: 'Bob', email: 'bob@test.com', role: 'TEAM_MEMBER', active: false },
]

function renderTeamMembers() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <TeamMembers />
      </AuthProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  userApi.getAll.mockResolvedValue({ data: MEMBERS })
})

// ── table rendering ───────────────────────────────────────────────────────────

describe('TeamMembers — table', () => {
  it('renders all members in the table', async () => {
    renderTeamMembers()
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument())
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('shows empty state when no members', async () => {
    userApi.getAll.mockResolvedValue({ data: [] })
    renderTeamMembers()
    await waitFor(() =>
      expect(screen.getByText(/no members yet/i)).toBeInTheDocument()
    )
  })

  it('shows Active/Inactive status correctly', async () => {
    renderTeamMembers()
    await waitFor(() => expect(screen.getByText('Active')).toBeInTheDocument())
    expect(screen.getByText('Inactive')).toBeInTheDocument()
  })
})

// ── add member ────────────────────────────────────────────────────────────────

describe('TeamMembers — add member', () => {
  it('opens the Add Member modal when button clicked', async () => {
    renderTeamMembers()
    await waitFor(() => screen.getByText('Alice'))
    await userEvent.click(screen.getByRole('button', { name: /add member/i }))
    expect(screen.getByText(/add member/i, { selector: '.modal-title' })).toBeInTheDocument()
  })

  it('name and email fields are required', async () => {
    renderTeamMembers()
    await waitFor(() => screen.getByText('Alice'))
    await userEvent.click(screen.getByRole('button', { name: /add member/i }))
    expect(screen.getByLabelText(/^name/i)).toBeRequired()
    expect(screen.getByLabelText(/^email/i)).toBeRequired()
  })

  it('password is required when adding a new member', async () => {
    renderTeamMembers()
    await waitFor(() => screen.getByText('Alice'))
    await userEvent.click(screen.getByRole('button', { name: /add member/i }))
    expect(screen.getByLabelText(/^password/i)).toBeRequired()
  })

  it('calls addMember with form values and refreshes list', async () => {
    userApi.addMember.mockResolvedValue({})
    renderTeamMembers()
    await waitFor(() => screen.getByText('Alice'))

    await userEvent.click(screen.getByRole('button', { name: /add member/i }))
    await userEvent.type(screen.getByLabelText(/^name/i), 'Carol')
    await userEvent.type(screen.getByLabelText(/^email/i), 'carol@test.com')
    await userEvent.type(screen.getByLabelText(/^password/i), 'secret')
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }))

    await waitFor(() =>
      expect(userApi.addMember).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Carol', email: 'carol@test.com' })
      )
    )
    expect(userApi.getAll).toHaveBeenCalledTimes(2) // initial load + reload
  })

  it('shows server error when addMember fails', async () => {
    userApi.addMember.mockRejectedValue({
      response: { data: { message: 'Email already in use' } },
    })
    renderTeamMembers()
    await waitFor(() => screen.getByText('Alice'))

    await userEvent.click(screen.getByRole('button', { name: /add member/i }))
    await userEvent.type(screen.getByLabelText(/^name/i), 'Carol')
    await userEvent.type(screen.getByLabelText(/^email/i), 'existing@test.com')
    await userEvent.type(screen.getByLabelText(/^password/i), 'secret')
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }))

    await waitFor(() =>
      expect(screen.getByText('Email already in use')).toBeInTheDocument()
    )
  })

  it('falls back to generic error when addMember fails without a message', async () => {
    userApi.addMember.mockRejectedValue({ response: {} })
    renderTeamMembers()
    await waitFor(() => screen.getByText('Alice'))

    await userEvent.click(screen.getByRole('button', { name: /add member/i }))
    await userEvent.type(screen.getByLabelText(/^name/i), 'X')
    await userEvent.type(screen.getByLabelText(/^email/i), 'x@x.com')
    await userEvent.type(screen.getByLabelText(/^password/i), 'pass')
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }))

    await waitFor(() =>
      expect(screen.getByText(/failed to save member/i)).toBeInTheDocument()
    )
  })

  it('closes the modal when Cancel is clicked', async () => {
    renderTeamMembers()
    await waitFor(() => screen.getByText('Alice'))
    await userEvent.click(screen.getByRole('button', { name: /add member/i }))
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByText(/add member/i, { selector: '.modal-title' })).not.toBeInTheDocument()
  })
})

// ── edit member ───────────────────────────────────────────────────────────────

describe('TeamMembers — edit member', () => {
  it('pre-fills the form with existing member data', async () => {
    renderTeamMembers()
    await waitFor(() => screen.getByText('Alice'))
    const rows = screen.getAllByRole('row')
    const aliceRow = rows.find(r => within(r).queryByText('Alice'))
    await userEvent.click(within(aliceRow).getByRole('button', { name: /edit/i }))
    expect(screen.getByLabelText(/^name/i)).toHaveValue('Alice')
    expect(screen.getByLabelText(/^email/i)).toHaveValue('alice@test.com')
  })

  it('password is NOT required when editing (leave blank keeps current)', async () => {
    renderTeamMembers()
    await waitFor(() => screen.getByText('Alice'))
    const rows = screen.getAllByRole('row')
    const aliceRow = rows.find(r => within(r).queryByText('Alice'))
    await userEvent.click(within(aliceRow).getByRole('button', { name: /edit/i }))
    expect(screen.getByLabelText(/^password/i)).not.toBeRequired()
  })

  it('calls update with member id and form values', async () => {
    userApi.update.mockResolvedValue({})
    renderTeamMembers()
    await waitFor(() => screen.getByText('Alice'))
    const rows = screen.getAllByRole('row')
    const aliceRow = rows.find(r => within(r).queryByText('Alice'))
    await userEvent.click(within(aliceRow).getByRole('button', { name: /edit/i }))
    await userEvent.clear(screen.getByLabelText(/^name/i))
    await userEvent.type(screen.getByLabelText(/^name/i), 'Alice Updated')
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }))
    await waitFor(() =>
      expect(userApi.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ name: 'Alice Updated' })
      )
    )
  })
})

// ── delete member ─────────────────────────────────────────────────────────────

describe('TeamMembers — delete member', () => {
  it('shows confirm modal when Delete is clicked', async () => {
    renderTeamMembers()
    await waitFor(() => screen.getByText('Alice'))
    const rows = screen.getAllByRole('row')
    const aliceRow = rows.find(r => within(r).queryByText('Alice'))
    await userEvent.click(within(aliceRow).getByRole('button', { name: /delete/i }))
    expect(screen.getByText(/delete member/i)).toBeInTheDocument()
    expect(screen.getByText(/permanently delete this member/i)).toBeInTheDocument()
  })

  it('calls remove and refreshes when confirmed', async () => {
    userApi.remove.mockResolvedValue({})
    renderTeamMembers()
    await waitFor(() => screen.getByText('Alice'))
    const rows = screen.getAllByRole('row')
    const aliceRow = rows.find(r => within(r).queryByText('Alice'))
    await userEvent.click(within(aliceRow).getByRole('button', { name: /delete/i }))
    await userEvent.click(screen.getByRole('button', { name: /confirm/i }))
    await waitFor(() =>
      expect(userApi.remove).toHaveBeenCalledWith(1)
    )
    expect(userApi.getAll).toHaveBeenCalledTimes(2)
  })

  it('does not call remove when Cancel is clicked', async () => {
    renderTeamMembers()
    await waitFor(() => screen.getByText('Alice'))
    const rows = screen.getAllByRole('row')
    const aliceRow = rows.find(r => within(r).queryByText('Alice'))
    await userEvent.click(within(aliceRow).getByRole('button', { name: /delete/i }))
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(userApi.remove).not.toHaveBeenCalled()
  })
})

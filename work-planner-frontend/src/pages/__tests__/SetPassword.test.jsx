import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import SetPassword from '../SetPassword'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../../api/axiosInstance', () => ({
  default: { post: vi.fn() },
}))

import axiosInstance from '../../api/axiosInstance'

function renderWithToken(token) {
  const search = token !== null ? `?token=${token}` : ''
  return render(
    <MemoryRouter initialEntries={[`/set-password${search}`]}>
      <Routes>
        <Route path="/set-password" element={<SetPassword />} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ── missing token ─────────────────────────────────────────────────────────────

describe('SetPassword — missing token', () => {
  it('shows invalid link error when no token in URL', () => {
    renderWithToken(null)
    expect(screen.getByText(/invalid link/i)).toBeInTheDocument()
  })

  it('does not render the form when token is missing', () => {
    renderWithToken(null)
    expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument()
  })
})

// ── field attributes ──────────────────────────────────────────────────────────

describe('SetPassword — field attributes', () => {
  it('new password field is required', () => {
    renderWithToken('valid-token')
    expect(screen.getByLabelText(/new password/i)).toBeRequired()
  })

  it('confirm password field is required', () => {
    renderWithToken('valid-token')
    expect(screen.getByLabelText(/confirm password/i)).toBeRequired()
  })

  it('both fields have type=password', () => {
    renderWithToken('valid-token')
    expect(screen.getByLabelText(/new password/i)).toHaveAttribute('type', 'password')
    expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute('type', 'password')
  })
})

// ── client-side validation ────────────────────────────────────────────────────

describe('SetPassword — client-side validation', () => {
  it('shows error when passwords do not match', async () => {
    renderWithToken('tok')
    await userEvent.type(screen.getByLabelText(/new password/i), 'abc123')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'xyz999')
    await userEvent.click(screen.getByRole('button', { name: /set password/i }))
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
  })

  it('shows error when password is shorter than 6 characters', async () => {
    renderWithToken('tok')
    await userEvent.type(screen.getByLabelText(/new password/i), 'ab12')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'ab12')
    await userEvent.click(screen.getByRole('button', { name: /set password/i }))
    expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument()
  })

  it('shows error for exactly 5 chars (boundary)', async () => {
    renderWithToken('tok')
    await userEvent.type(screen.getByLabelText(/new password/i), 'ab123')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'ab123')
    await userEvent.click(screen.getByRole('button', { name: /set password/i }))
    expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument()
  })

  it('does not show length error for exactly 6 chars (boundary)', async () => {
    axiosInstance.post.mockResolvedValue({})
    renderWithToken('tok')
    await userEvent.type(screen.getByLabelText(/new password/i), 'ab1234')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'ab1234')
    await userEvent.click(screen.getByRole('button', { name: /set password/i }))
    await waitFor(() =>
      expect(screen.queryByText(/at least 6 characters/i)).not.toBeInTheDocument()
    )
  })

  it('does not call the API when passwords do not match', async () => {
    renderWithToken('tok')
    await userEvent.type(screen.getByLabelText(/new password/i), 'abc123')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'different')
    await userEvent.click(screen.getByRole('button', { name: /set password/i }))
    expect(axiosInstance.post).not.toHaveBeenCalled()
  })

  it('does not call the API when password is too short', async () => {
    renderWithToken('tok')
    await userEvent.type(screen.getByLabelText(/new password/i), 'abc')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'abc')
    await userEvent.click(screen.getByRole('button', { name: /set password/i }))
    expect(axiosInstance.post).not.toHaveBeenCalled()
  })
})

// ── API error handling ────────────────────────────────────────────────────────

describe('SetPassword — API errors', () => {
  it('shows server error message on API failure', async () => {
    axiosInstance.post.mockRejectedValue({
      response: { data: { message: 'Token expired' } },
    })
    renderWithToken('bad-token')
    await userEvent.type(screen.getByLabelText(/new password/i), 'abc123')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'abc123')
    await userEvent.click(screen.getByRole('button', { name: /set password/i }))
    await waitFor(() =>
      expect(screen.getByText('Token expired')).toBeInTheDocument()
    )
  })

  it('falls back to generic error when API returns no message', async () => {
    axiosInstance.post.mockRejectedValue({ response: {} })
    renderWithToken('tok')
    await userEvent.type(screen.getByLabelText(/new password/i), 'abc123')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'abc123')
    await userEvent.click(screen.getByRole('button', { name: /set password/i }))
    await waitFor(() =>
      expect(screen.getByText(/invalid or expired link/i)).toBeInTheDocument()
    )
  })

  it('falls back to generic error on network failure', async () => {
    axiosInstance.post.mockRejectedValue(new Error('Network'))
    renderWithToken('tok')
    await userEvent.type(screen.getByLabelText(/new password/i), 'abc123')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'abc123')
    await userEvent.click(screen.getByRole('button', { name: /set password/i }))
    await waitFor(() =>
      expect(screen.getByText(/invalid or expired link/i)).toBeInTheDocument()
    )
  })
})

// ── loading state ─────────────────────────────────────────────────────────────

describe('SetPassword — loading state', () => {
  it('disables submit and shows "Saving…" while in flight', async () => {
    axiosInstance.post.mockReturnValue(new Promise(() => {}))
    renderWithToken('tok')
    await userEvent.type(screen.getByLabelText(/new password/i), 'abc123')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'abc123')
    await userEvent.click(screen.getByRole('button', { name: /set password/i }))
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()
  })
})

// ── success state ─────────────────────────────────────────────────────────────

describe('SetPassword — success', () => {
  it('shows success message after password is set', async () => {
    axiosInstance.post.mockResolvedValue({})
    renderWithToken('good-token')
    await userEvent.type(screen.getByLabelText(/new password/i), 'abc123')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'abc123')
    await userEvent.click(screen.getByRole('button', { name: /set password/i }))
    await waitFor(() =>
      expect(screen.getByText(/password set/i)).toBeInTheDocument()
    )
  })

  it('shows Go to Login button after success', async () => {
    axiosInstance.post.mockResolvedValue({})
    renderWithToken('good-token')
    await userEvent.type(screen.getByLabelText(/new password/i), 'abc123')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'abc123')
    await userEvent.click(screen.getByRole('button', { name: /set password/i }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /go to login/i })).toBeInTheDocument()
    )
  })

  it('sends the token from the URL to the API', async () => {
    axiosInstance.post.mockResolvedValue({})
    renderWithToken('my-reset-token')
    await userEvent.type(screen.getByLabelText(/new password/i), 'abc123')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'abc123')
    await userEvent.click(screen.getByRole('button', { name: /set password/i }))
    await waitFor(() =>
      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/auth/set-password',
        expect.objectContaining({ token: 'my-reset-token', password: 'abc123' })
      )
    )
  })

  it('navigates to /login when "Go to Login" is clicked', async () => {
    axiosInstance.post.mockResolvedValue({})
    renderWithToken('tok')
    await userEvent.type(screen.getByLabelText(/new password/i), 'abc123')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'abc123')
    await userEvent.click(screen.getByRole('button', { name: /set password/i }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /go to login/i })).toBeInTheDocument()
    )
    await userEvent.click(screen.getByRole('button', { name: /go to login/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })
})

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import Login from '../Login'
import { AuthProvider } from '../../context/AuthContext'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../../api/api', () => ({
  authApi: { login: vi.fn() },
}))

import { authApi } from '../../api/api'

function renderLogin() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

// ── field attributes ──────────────────────────────────────────────────────────

describe('Login — field attributes', () => {
  it('email input has type=email', () => {
    renderLogin()
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email')
  })

  it('password input has type=password by default', () => {
    renderLogin()
    expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password')
  })

  it('email field is required', () => {
    renderLogin()
    expect(screen.getByLabelText(/email/i)).toBeRequired()
  })

  it('password field is required', () => {
    renderLogin()
    expect(screen.getByLabelText(/password/i)).toBeRequired()
  })

  it('submit button is enabled on mount', () => {
    renderLogin()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeEnabled()
  })

  it('has a forgot-password link', () => {
    renderLogin()
    expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument()
  })
})

// ── password visibility toggle ────────────────────────────────────────────────

describe('Login — password visibility', () => {
  it('reveals password on Show click', async () => {
    renderLogin()
    await userEvent.click(screen.getByRole('button', { name: /show/i }))
    expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'text')
  })

  it('re-hides password on Hide click', async () => {
    renderLogin()
    await userEvent.click(screen.getByRole('button', { name: /show/i }))
    await userEvent.click(screen.getByRole('button', { name: /hide/i }))
    expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password')
  })
})

// ── loading state ─────────────────────────────────────────────────────────────

describe('Login — loading state', () => {
  it('disables submit and shows "Signing in…" while in flight', async () => {
    authApi.login.mockReturnValue(new Promise(() => {}))
    renderLogin()
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'pass')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()
  })

  it('re-enables submit after failure', async () => {
    authApi.login.mockRejectedValue({ response: { data: { message: 'Err' } } })
    renderLogin()
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'pass')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /sign in/i })).toBeEnabled()
    )
  })
})

// ── error messages ────────────────────────────────────────────────────────────

describe('Login — error handling', () => {
  it('shows server error message', async () => {
    authApi.login.mockRejectedValue({
      response: { data: { message: 'Account locked' } },
    })
    renderLogin()
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'pass')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() =>
      expect(screen.getByText('Account locked')).toBeInTheDocument()
    )
  })

  it('falls back to generic message when server sends no message', async () => {
    authApi.login.mockRejectedValue({ response: {} })
    renderLogin()
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'x')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() =>
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
    )
  })

  it('falls back to generic message on a network error (no response object)', async () => {
    authApi.login.mockRejectedValue(new Error('Network Error'))
    renderLogin()
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'x')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() =>
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
    )
  })

  it('clears previous error on the next submit', async () => {
    authApi.login
      .mockRejectedValueOnce({ response: { data: { message: 'Bad creds' } } })
      .mockResolvedValueOnce({ data: { token: 't', role: 'MANAGER', userId: 1, name: 'X' } })
    renderLogin()
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'pass')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(screen.getByText('Bad creds')).toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() =>
      expect(screen.queryByText('Bad creds')).not.toBeInTheDocument()
    )
  })
})

// ── navigation & storage after success ───────────────────────────────────────

describe('Login — success', () => {
  it('navigates to /manager for MANAGER role', async () => {
    authApi.login.mockResolvedValue({
      data: { token: 'tok', role: 'MANAGER', userId: 1, name: 'Alice' },
    })
    renderLogin()
    await userEvent.type(screen.getByLabelText(/email/i), 'mgr@test.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'pass')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/manager'))
  })

  it('navigates to /member for TEAM_MEMBER role', async () => {
    authApi.login.mockResolvedValue({
      data: { token: 'tok', role: 'TEAM_MEMBER', userId: 2, name: 'Bob' },
    })
    renderLogin()
    await userEvent.type(screen.getByLabelText(/email/i), 'mem@test.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'pass')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/member'))
  })

  it('saves JWT token to localStorage', async () => {
    authApi.login.mockResolvedValue({
      data: { token: 'jwt-xyz', role: 'MANAGER', userId: 1, name: 'Alice' },
    })
    renderLogin()
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'pass')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() =>
      expect(localStorage.getItem('wp_token')).toBe('jwt-xyz')
    )
  })
})

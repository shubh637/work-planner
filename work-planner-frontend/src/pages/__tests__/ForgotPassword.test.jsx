import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import ForgotPassword from '../ForgotPassword'

vi.mock('../../api/axiosInstance', () => ({
  default: { post: vi.fn() },
}))

import axiosInstance from '../../api/axiosInstance'

function renderFP() {
  return render(
    <MemoryRouter>
      <ForgotPassword />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ── field attributes ──────────────────────────────────────────────────────────

describe('ForgotPassword — field attributes', () => {
  it('renders email input with type=email', () => {
    renderFP()
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email')
  })

  it('email field is required', () => {
    renderFP()
    expect(screen.getByLabelText(/email/i)).toBeRequired()
  })

  it('submit button is enabled on mount', () => {
    renderFP()
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeEnabled()
  })

  it('has a back to login link', () => {
    renderFP()
    expect(screen.getByRole('link', { name: /back to login/i })).toBeInTheDocument()
  })
})

// ── loading state ─────────────────────────────────────────────────────────────

describe('ForgotPassword — loading state', () => {
  it('disables submit and shows "Sending…" while in flight', async () => {
    axiosInstance.post.mockReturnValue(new Promise(() => {}))
    renderFP()
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com')
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }))
    expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled()
  })
})

// ── success state ─────────────────────────────────────────────────────────────

describe('ForgotPassword — success', () => {
  it('shows "Check your email" screen after submission', async () => {
    axiosInstance.post.mockResolvedValue({})
    renderFP()
    await userEvent.type(screen.getByLabelText(/email/i), 'user@test.com')
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }))
    await waitFor(() =>
      expect(screen.getByText(/check your email/i)).toBeInTheDocument()
    )
  })

  it('shows the submitted email address in the confirmation', async () => {
    axiosInstance.post.mockResolvedValue({})
    renderFP()
    await userEvent.type(screen.getByLabelText(/email/i), 'myemail@example.com')
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }))
    await waitFor(() =>
      expect(screen.getByText(/myemail@example.com/i)).toBeInTheDocument()
    )
  })

  it('hides the form after successful submission', async () => {
    axiosInstance.post.mockResolvedValue({})
    renderFP()
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com')
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }))
    await waitFor(() =>
      expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument()
    )
  })

  it('shows "Back to Login" link on success screen', async () => {
    axiosInstance.post.mockResolvedValue({})
    renderFP()
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com')
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }))
    await waitFor(() =>
      expect(screen.getByRole('link', { name: /back to login/i })).toBeInTheDocument()
    )
  })
})

// ── error handling ────────────────────────────────────────────────────────────

describe('ForgotPassword — error handling', () => {
  it('shows generic error on API failure', async () => {
    axiosInstance.post.mockRejectedValue(new Error('fail'))
    renderFP()
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com')
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }))
    await waitFor(() =>
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    )
  })

  it('still shows the form after a failed submission', async () => {
    axiosInstance.post.mockRejectedValue(new Error('fail'))
    renderFP()
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com')
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }))
    await waitFor(() =>
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    )
  })

  it('re-enables the submit button after failure', async () => {
    axiosInstance.post.mockRejectedValue(new Error('fail'))
    renderFP()
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com')
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /send reset link/i })).toBeEnabled()
    )
  })

  it('does not show the success screen on failure', async () => {
    axiosInstance.post.mockRejectedValue(new Error('fail'))
    renderFP()
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com')
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }))
    await waitFor(() =>
      expect(screen.queryByText(/check your email/i)).not.toBeInTheDocument()
    )
  })
})

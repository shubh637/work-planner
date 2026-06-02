import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import axiosInstance from './axiosInstance'

// ── helpers ──────────────────────────────────────────────────────────────────

function setToken(token) {
  if (token === null) {
    localStorage.removeItem('wp_token')
  } else {
    localStorage.setItem('wp_token', token)
  }
}

// ── setup ─────────────────────────────────────────────────────────────────────

let mock

beforeEach(() => {
  mock = new MockAdapter(axiosInstance)
  localStorage.clear()
  // reset location.href tracking
  delete window.location
  window.location = { href: '' }
})

afterEach(() => {
  mock.restore()
  vi.restoreAllMocks()
})

// ── 1. Base URL ───────────────────────────────────────────────────────────────

describe('baseURL', () => {
  it('sends requests to /api by default', async () => {
    mock.onGet('/users').reply(200, [])
    const res = await axiosInstance.get('/users')
    expect(res.status).toBe(200)
    expect(mock.history.get[0].baseURL).toBe('/api')
  })
})

// ── 2. Request interceptor — Authorization header ────────────────────────────

describe('request interceptor – Authorization header', () => {
  it('attaches Bearer token when wp_token is in localStorage', async () => {
    setToken('my-jwt-token')
    mock.onGet('/me').reply(200, {})

    await axiosInstance.get('/me')

    expect(mock.history.get[0].headers.Authorization).toBe('Bearer my-jwt-token')
  })

  it('does NOT attach Authorization header when no token is stored', async () => {
    setToken(null)
    mock.onGet('/me').reply(200, {})

    await axiosInstance.get('/me')

    expect(mock.history.get[0].headers.Authorization).toBeUndefined()
  })

  it('uses the token that is in localStorage at call time, not at module load time', async () => {
    setToken(null)
    mock.onGet('/me').reply(200, {})

    // token added after module was imported
    setToken('late-token')
    await axiosInstance.get('/me')

    expect(mock.history.get[0].headers.Authorization).toBe('Bearer late-token')
  })

  it('sends updated token after it changes between requests', async () => {
    setToken('token-v1')
    mock.onGet('/me').reply(200, {})

    await axiosInstance.get('/me')
    expect(mock.history.get[0].headers.Authorization).toBe('Bearer token-v1')

    setToken('token-v2')
    await axiosInstance.get('/me')
    expect(mock.history.get[1].headers.Authorization).toBe('Bearer token-v2')
  })

  it('sends no Authorization header after token is removed between requests', async () => {
    setToken('old-token')
    mock.onGet('/me').reply(200, {})

    await axiosInstance.get('/me')
    expect(mock.history.get[0].headers.Authorization).toBe('Bearer old-token')

    setToken(null)
    await axiosInstance.get('/me')
    expect(mock.history.get[1].headers.Authorization).toBeUndefined()
  })

  it('handles an empty string token gracefully (no header)', async () => {
    localStorage.setItem('wp_token', '')
    mock.onGet('/me').reply(200, {})

    await axiosInstance.get('/me')

    // empty string is falsy — interceptor should not attach the header
    expect(mock.history.get[0].headers.Authorization).toBeUndefined()
  })
})

// ── 3. Response interceptor — 401 auto-logout ────────────────────────────────

describe('response interceptor – 401 handling', () => {
  it('clears wp_token from localStorage on a 401', async () => {
    setToken('expired-token')
    mock.onGet('/protected').reply(401, { message: 'Unauthorized' })

    await axiosInstance.get('/protected').catch(() => {})

    expect(localStorage.getItem('wp_token')).toBeNull()
  })

  it('clears wp_user from localStorage on a 401', async () => {
    localStorage.setItem('wp_user', JSON.stringify({ name: 'Alice' }))
    mock.onGet('/protected').reply(401)

    await axiosInstance.get('/protected').catch(() => {})

    expect(localStorage.getItem('wp_user')).toBeNull()
  })

  it('redirects to /login on a 401', async () => {
    setToken('expired-token')
    mock.onGet('/protected').reply(401)

    await axiosInstance.get('/protected').catch(() => {})

    expect(window.location.href).toBe('/login')
  })

  it('still rejects the promise after a 401 so callers can handle it', async () => {
    mock.onGet('/protected').reply(401)

    await expect(axiosInstance.get('/protected')).rejects.toMatchObject({
      response: { status: 401 },
    })
  })

  it('does NOT redirect on a 400 error', async () => {
    mock.onGet('/bad').reply(400, { message: 'Bad Request' })

    await axiosInstance.get('/bad').catch(() => {})

    expect(window.location.href).not.toBe('/login')
  })

  it('does NOT redirect on a 403 error', async () => {
    mock.onGet('/forbidden').reply(403)

    await axiosInstance.get('/forbidden').catch(() => {})

    expect(window.location.href).not.toBe('/login')
  })

  it('does NOT redirect on a 500 error', async () => {
    mock.onGet('/crash').reply(500)

    await axiosInstance.get('/crash').catch(() => {})

    expect(window.location.href).not.toBe('/login')
  })

  it('does NOT clear localStorage on a non-401 error', async () => {
    setToken('valid-token')
    localStorage.setItem('wp_user', '{"name":"Bob"}')
    mock.onGet('/crash').reply(500)

    await axiosInstance.get('/crash').catch(() => {})

    expect(localStorage.getItem('wp_token')).toBe('valid-token')
    expect(localStorage.getItem('wp_user')).toBe('{"name":"Bob"}')
  })
})

// ── 4. Successful responses pass through unchanged ───────────────────────────

describe('successful responses', () => {
  it('resolves with the response on 200', async () => {
    mock.onGet('/tasks').reply(200, [{ id: 1 }])

    const res = await axiosInstance.get('/tasks')

    expect(res.status).toBe(200)
    expect(res.data).toEqual([{ id: 1 }])
  })

  it('resolves on 201 Created', async () => {
    mock.onPost('/tasks').reply(201, { id: 99 })

    const res = await axiosInstance.post('/tasks', { title: 'New' })

    expect(res.status).toBe(201)
    expect(res.data.id).toBe(99)
  })

  it('resolves on 204 No Content', async () => {
    mock.onDelete('/tasks/1').reply(204)

    const res = await axiosInstance.delete('/tasks/1')

    expect(res.status).toBe(204)
  })

  it('does not touch localStorage on a successful request', async () => {
    setToken('good-token')
    localStorage.setItem('wp_user', '{"name":"Carol"}')
    mock.onGet('/tasks').reply(200, [])

    await axiosInstance.get('/tasks')

    expect(localStorage.getItem('wp_token')).toBe('good-token')
    expect(localStorage.getItem('wp_user')).toBe('{"name":"Carol"}')
  })
})

// ── 5. Default Content-Type header ───────────────────────────────────────────

describe('default headers', () => {
  it('sends Content-Type: application/json by default', async () => {
    mock.onPost('/tasks').reply(201, {})

    await axiosInstance.post('/tasks', { title: 'Test' })

    expect(mock.history.post[0].headers['Content-Type']).toContain('application/json')
  })
})

// ── 6. Network / no-response errors ──────────────────────────────────────────

describe('network errors', () => {
  it('rejects when the network is unreachable', async () => {
    mock.onGet('/tasks').networkError()

    await expect(axiosInstance.get('/tasks')).rejects.toThrow()
  })

  it('rejects on a timeout', async () => {
    mock.onGet('/tasks').timeout()

    await expect(axiosInstance.get('/tasks')).rejects.toThrow()
  })

  it('does not clear localStorage on a network error (no response)', async () => {
    setToken('good-token')
    mock.onGet('/tasks').networkError()

    await axiosInstance.get('/tasks').catch(() => {})

    expect(localStorage.getItem('wp_token')).toBe('good-token')
  })
})

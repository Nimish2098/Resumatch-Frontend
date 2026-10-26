import { useEffect, useState } from 'react'
import { apiFetch } from '../api/apiFetch'
import type { AuthResponse, User } from '../types'

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('docapproval-token'))
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('docapproval-user')
    return saved ? (JSON.parse(saved) as User) : null
  })
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (token) localStorage.setItem('docapproval-token', token)
    else localStorage.removeItem('docapproval-token')
  }, [token])

  useEffect(() => {
    if (user) localStorage.setItem('docapproval-user', JSON.stringify(user))
    else localStorage.removeItem('docapproval-user')
  }, [user])

  const login = async (body: { email: string; password: string; name?: string }) => {
    try {
      const endpoint = body.name ? '/api/auth/register' : '/api/auth/login'
      const res = await apiFetch<AuthResponse>(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      })
      setUser({ id: res.userId, name: res.name, email: res.email })
      setToken(res.accessToken)
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Authentication failed')
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    setErrorMessage('')
  }

  return { token, user, errorMessage, login, logout }
}
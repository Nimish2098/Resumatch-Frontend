import { useState } from 'react'
import type { SubmitEvent } from 'react'

type AuthPageProps = {
  onSubmit: (payload: { email: string; password: string; name?: string }) => Promise<void> | void
}


export default function AuthPage({ onSubmit }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({})

  const validate = () => {
    const nextErrors: { name?: string; email?: string; password?: string } = {}

    if (mode === 'register' && name.trim().length < 2) {
      nextErrors.name = 'Name must be at least 2 characters.'
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'Please enter a valid email address.'
    }

    if (password.length < 6) {
      nextErrors.password = 'Password must contain at least 6 characters.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

const onFormSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
  event.preventDefault()
  if (!validate()) {
    return
  }

  await onSubmit({
    name: mode === 'register' ? name : undefined,
    email,
    password,
  })
}

  return (
    <div className="auth-layout">
      <div className="auth-panel">
        <p className="eyebrow">Welcome back</p>
        <h2>{mode === 'login' ? 'Log in to your workspace' : 'Create your account'}</h2>

        <div className="toggle-row">
          <button
            type="button"
            className={mode === 'login' ? 'toggle-button active' : 'toggle-button'}
            onClick={() => setMode('login')}
          >
            Log in
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'toggle-button active' : 'toggle-button'}
            onClick={() => setMode('register')}
          >
            Create account
          </button>
        </div>

        <form onSubmit={(event) => void onFormSubmit(event)} className="stack-form">
          {mode === 'register' ? (
            <label>
              <span>Name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} />
              {errors.name ? <small>{errors.name}</small> : null}
            </label>
          ) : null}

          <label>
            <span>Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            {errors.email ? <small>{errors.email}</small> : null}
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {errors.password ? <small>{errors.password}</small> : null}
          </label>

          <button type="submit" className="primary-button">
            {mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}

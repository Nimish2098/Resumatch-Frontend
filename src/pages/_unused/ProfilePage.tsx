import { useEffect, useState } from 'react'
import { apiFetch } from '../../api/apiFetch'
import type { User } from '../../types'

type ProfilePageProps = {
  user: User | null
  token: string
  onUpdateUser: (user: User | null) => void
  onLogout: () => void
}

export function ProfilePage({ user, token, onUpdateUser, onLogout }: ProfilePageProps) {
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    setName(user?.name ?? '')
    setEmail(user?.email ?? '')
  }, [user])

  const handleSaveProfile = async () => {
    if (!user) return

    try {
      const result = await apiFetch<{ name: string; email: string }>('/user/profile', {
        method: 'PUT',
        body: JSON.stringify({ name, email }),
      }, token)
      onUpdateUser({ ...user, ...result })
    } catch {
      // ignore update failures
    }
  }

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      return
    }

    try {
      await apiFetch('/user/change-password', {
        method: 'PATCH',
        body: JSON.stringify({
          currentPassword: password,
          newPassword,
          confirmPassword,
        }),
      }, token)
      setPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      // ignore password failures
    }
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm('This will permanently delete your account. Continue?')) {
      return
    }

    try {
      await apiFetch('/user/profile', { method: 'DELETE' }, token)
      onLogout()
    } catch {
      // ignore delete failures
    }
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Profile</p>
          <h2>Account settings</h2>
        </div>
      </div>

      <div className="profile-grid">
        <div className="panel">
          <h3>Profile details</h3>
          <div className="stack-form">
            <label>
              <span>Name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label>
              <span>Email</span>
              <input value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <button type="button" className="primary-button" onClick={() => void handleSaveProfile()}>
              Save profile
            </button>
          </div>
        </div>

        <div className="panel">
          <h3>Change password</h3>
          <div className="stack-form">
            <label>
              <span>Current password</span>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            <label>
              <span>New password</span>
              <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            </label>
            <label>
              <span>Confirm new password</span>
              <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            </label>
            <button type="button" className="secondary-button" onClick={() => void handlePasswordChange()}>
              Update password
            </button>
          </div>
        </div>
      </div>

      <div className="danger-zone large">
        <h3>Delete account</h3>
        <p>This action is irreversible and removes your profile and document data.</p>
        <button type="button" className="danger-button" onClick={() => void handleDeleteAccount()}>
          Delete account
        </button>
      </div>
    </div>
  )
}
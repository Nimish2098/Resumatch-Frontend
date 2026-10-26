import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import type { User } from '../types'
import './AuthenticatedHeader.css'

const navItems = [
  { to: '/home', label: 'Dashboard' },
  { to: '/analysis', label: 'Resume Analysis' },
  { to: '/analysis/history', label: 'Analysis History' },
]

const initials = (name?: string) =>
  (name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'U'

type AuthenticatedHeaderProps = {
  user: User | null
  onLogout: () => void
}

export default function AuthenticatedHeader({ user, onLogout }: AuthenticatedHeaderProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <header className="ah">
      <NavLink className="ah-brand" to="/home" aria-label="ResuMatch home">
        <span className="ah-dot" />
        <span>RESUMATCH</span>
      </NavLink>

      <nav className="ah-nav" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end className={({ isActive }) => (isActive ? 'ah-link is-active' : 'ah-link')}>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="ah-user" ref={menuRef}>
        <button
          type="button"
          className="ah-user-btn"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="ah-avatar">{initials(user?.name)}</span>
          <span className="ah-name">{user?.name ?? 'User'}</span>
          <span className={`ah-chevron${open ? ' is-open' : ''}`} aria-hidden="true">▾</span>
        </button>

        {open ? (
          <div className="ah-menu" role="menu">
            <div className="ah-menu-head">
              <span className="ah-avatar ah-avatar-lg">{initials(user?.name)}</span>
              <div>
                <strong>{user?.name ?? 'User'}</strong>
                {user?.email ? <small>{user.email}</small> : null}
              </div>
            </div>
            <button
              type="button"
              role="menuitem"
              className="ah-signout"
              onClick={() => { setOpen(false); onLogout() }}
            >
              Sign out <span aria-hidden="true">→</span>
            </button>
          </div>
        ) : null}
      </div>
    </header>
  )
}
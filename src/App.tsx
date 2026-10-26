import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import AuthenticatedHeader from './components/AuthenticatedHeader'
import HomePage from './pages/home_page/HomePage'
import DashboardPage from './pages/Dashboard'
import AuthPage from './pages/AuthPage'
import ResumeAnalysisPage from './pages/ResumeAnalysisPage'
import AnalysisHistoryPage from './pages/AnalysisHistoryPage'
import type { AnalysisResult } from './types'
import './App.css'

function App() {
  const { token, user, errorMessage, login, logout } = useAuth()
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)

  const handleLogout = () => {
    logout()
    setAnalysisResult(null)
  }

  return (
    <BrowserRouter>
      <div className={token ? 'app-shell authenticated-shell' : 'app-shell'}>
        {token ? <AuthenticatedHeader user={user} onLogout={handleLogout} /> : null}

        <main className="content-area">
          {errorMessage ? <div className="inline-banner">{errorMessage}</div> : null}

          <Routes>
            <Route path="/" element={token ? <Navigate to="/home" replace /> : <HomePage />} />
            <Route path="/home" element={token ? <DashboardPage token={token} userName={user?.name} /> : <HomePage />} />
            <Route
              path="/auth"
              element={token ? <Navigate to="/home" replace /> : <AuthPage onSubmit={login} />}
            />
            <Route path="/documents/*" element={<Navigate to="/home" replace />} />
            <Route path="/applications" element={<Navigate to="/home" replace />} />
            <Route path="/profile" element={<Navigate to="/home" replace />} />
            <Route
              path="/analysis"
              element={
                <ResumeAnalysisPage onResult={setAnalysisResult} initialResult={analysisResult} token={token} />
              }
            />
            <Route
              path="/analysis/history"
              element={token ? <AnalysisHistoryPage token={token} /> : <Navigate to="/" replace />}
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
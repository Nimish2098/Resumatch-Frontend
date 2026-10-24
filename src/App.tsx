import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BrowserRouter,
  NavLink,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router-dom'
import { ApiError, apiRequest } from './api/client'
import './App.css'
import "./styles/theme.css";

const ANALYSIS_LOADING_MESSAGES = [
  'READING RESUME STRUCTURE…',
  'COMPARING ROLE LANGUAGE…',
  'PREPARING YOUR REVIEW…',
]

type User = {
  id?: number
  name: string
  email: string
}

type DocumentSummary = { id: string; title: string; createdAt: string }
type DocumentDetail = { id: string; title: string; content: string; createdAt: string; updatedAt: string }
type VersionSummary = { id: string; message: string; createdAt: string }
type VersionDetail = { id: string; documentId: string; message: string; content: string; createdAt: string }

type AnalysisResult = {
  id: number | null
  originalFilename: string
  contentType: string | null
  overallScore: number
  scoreLabel: string
  report: {
    summary: string
    parameters: Array<{ parameter: string; score: number; weight: number; summary: string }>
    issues: Array<{
      parameter: string
      severity: string
      source: string | null
      evidence: string | null
      problem: string
      fix: string
      rewrite: string | null
    }>
    missingMaterial: Array<{ type: string; whyItMatters: string; howToAdd: string }>
    actionPlan: Array<{ priority: number; title: string; details: string; timeEstimate: string; impact: string }>
  }
  createdAt: string
}

type ApplicationStatus = 'APPLIED' | 'REJECTED' | 'INTERVIEW'
type Application = { id: string; position: string; company: string; status: ApplicationStatus; date: string; url: string }

type AuthResponse = {
  accessToken: string
  tokenType?: string
  userId: number
  name: string
  email: string
}

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string | null,
): Promise<T> {
  return apiRequest<T>(path, options, accessToken)
}

function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('docapproval-token'))
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('docapproval-user')
    return savedUser ? (JSON.parse(savedUser) as User) : null
  })
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (token) {
      localStorage.setItem('docapproval-token', token)
    } else {
      localStorage.removeItem('docapproval-token')
    }
  }, [token])

  useEffect(() => {
    if (user) {
      localStorage.setItem('docapproval-user', JSON.stringify(user))
    } else {
      localStorage.removeItem('docapproval-user')
    }
  }, [user])

  const navItems = useMemo(
    () => [
      { to: '/home', label: 'Dashboard' },
      { to: '/analysis', label: 'Resume Analysis' },
      { to: '/analysis/history', label: 'Analysis History' },
    ],
    [],
  )

  const handleLogin = async (body: { email: string; password: string; name?: string }) => {
    try {
      const endpoint = body.name ? '/api/auth/register' : '/api/auth/login'
      const response = await apiFetch<AuthResponse>(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      })

      const nextUser: User = {
        id: response.userId,
        name: response.name,
        email: response.email,
      }

      setUser(nextUser)
      setToken(response.accessToken)
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Authentication failed')
    }
  }

  const handleLogout = () => {
    setToken(null)
    setUser(null)
    setAnalysisResult(null)
    setErrorMessage('')
  }

  return (
    <BrowserRouter>
      <div className={token ? 'app-shell authenticated-shell' : 'app-shell'}>
        {token ? (
          <header className="authenticated-header">
            <NavLink className="brand-mark" to="/home" aria-label="ResuMatch home">
              <span className="brand-dot" />
              <span>RESUMATCH</span>
            </NavLink>

            <nav className="authenticated-nav" aria-label="Main navigation">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="authenticated-user">
              <span>{user?.name ?? 'User'}</span>
              <button className="secondary-button" type="button" onClick={() => void handleLogout()}>
                Sign out
              </button>
            </div>
          </header>
        ) : null}

        <main className="content-area">
          {errorMessage ? <div className="inline-banner">{errorMessage}</div> : null}

          <Routes>
            <Route path="/" element={token ? <Navigate to="/home" replace /> : <HomePage />} />
            <Route path="/home" element={token ? <DashboardPage token={token} /> : <HomePage />} />
            <Route
              path="/auth"
              element={token ? <Navigate to="/home" replace /> : <AuthPage onSubmit={handleLogin} />}
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
              element={
                token ? <AnalysisHistoryPage token={token} /> : <Navigate to="/" replace />
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

type AuthPageProps = {
  onSubmit: (payload: { email: string; password: string; name?: string }) => Promise<void> | void
}

function HomePage() {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [selectedSample, setSelectedSample] = useState<number | null>(null)
  const storySectionRef = useRef<HTMLElement>(null)
  const storyVisualRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (motionPreference.matches) return

    const interval = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % 4)
    }, 4500)

    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    const section = storySectionRef.current
    const visual = storyVisualRef.current
    if (!section || !visual || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let animationFrame = 0
    let isNearViewport = false
    let resizeObserver: ResizeObserver | undefined

    const updateScale = () => {
      animationFrame = 0
      if (!isNearViewport) return

      const rect = section.getBoundingClientRect()
      const travel = rect.height + window.innerHeight * 0.4
      const progress = Math.min(1, Math.max(0, (window.innerHeight * 0.8 - rect.top) / travel))
      visual.style.setProperty('--resume-preview-scale', String(1 + progress * 0.2))
    }

    const requestUpdate = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(updateScale)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        isNearViewport = entry.isIntersecting
        if (isNearViewport) requestUpdate()
        else visual.style.setProperty('--resume-preview-scale', '1')
      },
      { rootMargin: '160px 0px' },
    )

    observer.observe(section)
    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(requestUpdate)
      resizeObserver.observe(section)
    }
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)

    return () => {
      observer.disconnect()
      resizeObserver?.disconnect()
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
      if (animationFrame) window.cancelAnimationFrame(animationFrame)
    }
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const steps = document.querySelectorAll<HTMLElement>('[data-story-step]')
    if (!steps.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleStep = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visibleStep) {
          setActiveStep(Number((visibleStep.target as HTMLElement).dataset.storyStep))
        }
      },
      { rootMargin: '-35% 0px -35% 0px', threshold: [0, 0.2, 0.5, 0.8] },
    )

    steps.forEach((step) => observer.observe(step))
    return () => observer.disconnect()
  }, [])

  const steps = [
    { number: '01', title: 'Upload', detail: 'Start with the experience you already have.', metric: 'FORMAT CHECK: 6 / 7 SIGNALS', missing: 'Missing: measurable outcomes', fix: 'Fix: lead one bullet with scope and result.' },
    { number: '02', title: 'ATS score', detail: 'See how clearly your profile reads to a parser.', metric: 'ATS READABILITY: 74 / 100', missing: 'Missing keyword: stakeholder management', fix: 'Fix: use the exact role language where it is accurate.' },
    { number: '03', title: 'Keyword match', detail: 'Find the role requirements your resume may be missing.', metric: 'ROLE MATCH: 8 / 11 KEYWORDS', missing: 'Missing keyword: experimentation', fix: 'Fix: connect a project to a test, learning, or decision.' },
    { number: '04', title: 'Fixes', detail: 'Leave with specific improvements, not vague advice.', metric: 'PRIORITY FIX: HIGH IMPACT', missing: 'Review: impact is implied in 2 bullets', fix: 'Fix: name the outcome before describing the work.' },
  ]
  const stories = [
    { eyebrow: '01 / READABILITY', title: 'Make the first read count.', detail: 'A clear structure gives recruiters and screening systems a better chance of finding the experience that matters.', highlight: 'Structure & hierarchy', output: 'Section order is clear. Move the strongest result into the first bullet.' },
    { eyebrow: '02 / RELEVANCE', title: 'Put the right skills in view.', detail: 'Compare your resume with a role description to spot the language and capabilities that are not coming through.', highlight: 'Role-specific keywords', output: 'Missing keyword: experimentation. Add it only where your experience supports it.' },
    { eyebrow: '03 / IMPACT', title: 'Show the value behind the work.', detail: 'Bring outcomes forward. Specific scope and measurable results make your contribution easier to understand.', highlight: 'Evidence of impact', output: '2 bullets describe work without a result. Add a metric, decision, or customer outcome.' },
    { eyebrow: '04 / NEXT STEPS', title: 'Turn feedback into action.', detail: 'Prioritize a short list of practical edits and refine your profile with a clearer direction.', highlight: 'Actionable recommendations', output: 'Quick win: rewrite the onboarding bullet to lead with its retention result.' },
  ]
  const activeStory = stories[activeStep]
  const sampleReports = [
    {
      role: 'Product manager',
      score: 82,
      summary: 'Strong foundations. Bring outcomes and experiment results further forward.',
      gaps: ['Experimentation', 'Market analysis'],
      nextStep: 'Add one experiment result and show the customer or revenue outcome it influenced.',
    },
    {
      role: 'Frontend engineer',
      score: 76,
      summary: 'Relevant stack. Add more context on scale, accessibility, and delivery impact.',
      gaps: ['Accessibility', 'Performance optimization'],
      nextStep: 'Connect a technical decision to a measurable improvement in speed, reach, or reliability.',
    },
    {
      role: 'Data analyst',
      score: 89,
      summary: 'Clear technical range. Make stakeholder decisions and business outcomes explicit.',
      gaps: ['Stakeholder communication', 'Business impact'],
      nextStep: 'Pair an insight with the decision it changed and the business outcome that followed.',
    },
  ]
  const startAnalysis = () => {
    navigate('/analysis')
  }
  const openInteractivePreview = (index: number) => {
    setSelectedSample(index)
    window.requestAnimationFrame(() => {
      document.getElementById('interactive-preview')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }

  return (
    <div className="home-page-shell">
      <header className="topbar">
        <div className="brand-mark">
          <div className="brand-dot" />
          <span>RESUMATCH</span>
        </div>

        <nav className="topnav" aria-label="Main navigation">
          <a className="nav-pill" href="#approach">The approach</a>
          <a className="nav-pill" href="#sample-reports">Sample reports</a>
        </nav>

        <button type="button" className="outline-button topbar-sign-in" onClick={() => navigate('/auth')}>
          Sign in
        </button>
      </header>

      <main className="home-hero">
        <div className="hero-content">
          <p className="section-kicker"><span className="accent-mark" /> CLARITY BEFORE THE RECRUITER DOES</p>
          <h1>Make your next move <span>with clarity.</span></h1>
          <p className="hero-copy">
            A considered read of your resume against the role you want. Understand what is working,
            what is missing, and where to focus next.
          </p>

          <div className="hero-actions">
            <button type="button" className="primary-button hero-primary-cta" onClick={startAnalysis}>
              Analyze my resume <span aria-hidden="true">↗</span>
            </button>
            <a className="text-link" href="#sample-reports">Explore a sample report <span aria-hidden="true">↓</span></a>
          </div>
          <p className="input-note">Text-based analysis · Your resume text stays in your control</p>
        </div>

        <div className="hero-index" aria-hidden="true"><span>01</span><i /><span>04</span></div>
      </main>

      <section className="process-section" id="approach" aria-labelledby="process-title">
        <div className="section-heading">
          <p className="section-kicker">A CLEARER WAY FORWARD</p>
          <h2 id="process-title">From first read to next step.</h2>
          <p>Four focused perspectives. One more confident application.</p>
        </div>
        <div className="step-track" role="tablist" aria-label="Analysis steps">
          {steps.map((step, index) => (
            <button
              className={`step-tab${activeStep === index ? ' is-active' : ''}`}
              id={`step-tab-${index}`}
              key={step.number}
              type="button"
              role="tab"
              aria-selected={activeStep === index}
              aria-controls="step-preview"
              onClick={() => setActiveStep(index)}
            >
              <span className="step-number">{step.number}</span>
              <span>{step.title}</span>
            </button>
          ))}
          <div className="step-preview" id="step-preview" role="tabpanel" aria-labelledby={`step-tab-${activeStep}`}>
            <span className="mono-label">{steps[activeStep].number} / 04</span>
            <p>{steps[activeStep].detail}</p>
          </div>
          <div className="metric-snapshot" aria-live="polite">
            <span className="mono-label">SAMPLE OUTPUT</span>
            <strong>{steps[activeStep].metric}</strong>
            <span className="metric-missing">{steps[activeStep].missing}</span>
            <p><b>Quick fix:</b> {steps[activeStep].fix}</p>
          </div>
        </div>
      </section>

      <section ref={storySectionRef} className="story-section" aria-label="What a clearer resume can do">
        <div className="story-copy">
          <p className="section-kicker">READING BETWEEN THE LINES</p>
          {stories.map((story, index) => (
            <article
              className={`story-copy-item${activeStep === index ? ' is-active' : ''}`}
              data-story-step={index}
              key={story.eyebrow}
            >
              <p className="mono-label">{story.eyebrow}</p>
              <h2>{story.title}</h2>
              <p>{story.detail}</p>
            </article>
          ))}
        </div>
        <div className="story-visual-wrap">
          <div className="story-visual-viewport">
          <div ref={storyVisualRef} className="story-visual">
            <div className="resume-mock-header">
              <span className="mono-label">RESUMATCH / PROFILE REVIEW</span>
              <span className="live-indicator">ILLUSTRATIVE</span>
            </div>
            <div className="resume-mock">
              <div className="resume-mock-identity">
                <span className="resume-avatar">JD</span>
                <div><strong>Jordan Davis</strong><span>Product Manager · SaaS</span></div>
              </div>
              <div className="resume-rule" />
              <div className="resume-mock-section">
                <span className="mono-label">EXPERIENCE</span>
                <div className="mock-line long" />
                <div className="mock-line" />
                <div className="mock-line short" />
                <div className={`highlight-frame highlight-${activeStep}`}><span>{activeStory.highlight}</span></div>
              </div>
              <div className="resume-mock-section">
                <span className="mono-label">SELECTED SKILLS</span>
                <div className="skill-chip-row"><span>Roadmapping</span><span>Research</span><span>Analytics</span></div>
              </div>
            </div>
            <div className="story-callout"><span className="accent-mark" /><div><span className="mono-label">{activeStory.eyebrow}</span><strong>{activeStory.highlight}</strong></div></div>
            <div className="story-output-snapshot" aria-live="polite">
              <span className="mono-label">SAMPLE REVIEW NOTE</span>
              <p>{activeStory.output}</p>
            </div>
          </div>
          </div>
        </div>
      </section>

      <section className="sample-section" id="sample-reports" aria-labelledby="sample-title">
        <div className="section-heading sample-heading">
          <div>
            <p className="section-kicker">A LOOK INSIDE</p>
            <h2 id="sample-title">See the signal in a sample.</h2>
          </div>
          <span className="mono-label">STATIC EXAMPLES · LOAD ONE TO TRY THE INTERACTIVE PREVIEW</span>
        </div>
        <div className="sample-grid">
          {sampleReports.map((sample, index) => (
          <article className="sample-card" key={sample.role}>
            <div className="sample-card-top"><span className="mono-label">{String(index + 1).padStart(2, '0')} / {['PRODUCT', 'ENGINEERING', 'ANALYTICS'][index]}</span><span className="sample-badge">STATIC SAMPLE</span></div>
            <h3>{sample.role}</h3>
            <p>{sample.summary}</p>
            <div className="sample-card-bottom"><span>ROLE ALIGNMENT</span><strong>{sample.score}<span>%</span></strong></div>
            <button type="button" className="sample-preview-button" onClick={() => openInteractivePreview(index)} aria-pressed={selectedSample === index}>
              Try interactive preview <span aria-hidden="true">→</span>
            </button>
          </article>
          ))}
        </div>
        {selectedSample !== null ? (
          <section className="interactive-preview" id="interactive-preview" tabIndex={-1} aria-live="polite" aria-labelledby="interactive-preview-title">
            <div className="interactive-preview-header">
              <div>
                <p className="interactive-status"><span aria-hidden="true" /> LIVE INTERACTIVE PREVIEW</p>
                <h3 id="interactive-preview-title">{sampleReports[selectedSample].role} analysis</h3>
                <p>Sample data is loaded below — this is a mock live analysis, not a review of your resume.</p>
              </div>
              <button type="button" className="interactive-close" onClick={() => setSelectedSample(null)}>Close preview</button>
            </div>
            <div className="interactive-preview-grid">
              <div className="interactive-score" aria-label={`${sampleReports[selectedSample].score}% role alignment`}>
                <span>ROLE ALIGNMENT</span>
                <strong>{sampleReports[selectedSample].score}<small>%</small></strong>
              </div>
              <div className="interactive-insight">
                <span className="mono-label">LIVE SUMMARY</span>
                <p>{sampleReports[selectedSample].summary}</p>
                <span className="mono-label">KEYWORDS TO REVIEW</span>
                <div className="skill-chip-row">{sampleReports[selectedSample].gaps.map((gap) => <span key={gap}>{gap}</span>)}</div>
              </div>
              <div className="interactive-next-step">
                <span className="mono-label">SUGGESTED NEXT STEP</span>
                <p>{sampleReports[selectedSample].nextStep}</p>
                <button type="button" className="primary-button" onClick={startAnalysis}>Analyze my resume <span aria-hidden="true">→</span></button>
              </div>
            </div>
          </section>
        ) : null}
      </section>

      <section className="closing-section">
        <p className="section-kicker">THE NEXT CHAPTER STARTS WITH A CLEAR READ</p>
        <p className="closing-copy">Your experience is already there. <span>Make it easier to see.</span></p>
        <button type="button" className="primary-button" onClick={startAnalysis}>
          Start your analysis <span aria-hidden="true">↗</span>
        </button>
      </section>

      <footer className="home-footer">
        <span className="brand-mark"><span className="brand-dot" /> RESUMATCH</span>
        <span className="mono-label">CAREER CLARITY, BY DESIGN</span>
      </footer>
    </div>
  )
}

type DashboardPageProps = {
  token: string
}

function DashboardPage({ token,}: DashboardPageProps) {
  const navigate = useNavigate()
  const [reports, setReports] = useState<AnalysisResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true)
      setError('')
      try {
        const history = await apiFetch<AnalysisResult[]>('/api/v1/resume-analysis', {}, token)
        setReports(history)
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load your recent analyses.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadDashboard()
  }, [token])

  const recentReports = reports.slice(0, 3)
  const averageScore = reports.length
    ? Math.round(reports.reduce((sum, report) => sum + report.overallScore, 0) / reports.length)
    : null

return (
    <div className="page-shell dashboard-page">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Your career dashboard</p>
          <h1>Keep your next move moving.</h1>
          <p>Review your resume feedback and return to the actions that matter most.</p>
        </div>
        <button type="button" className="primary-button" onClick={() => navigate('/analysis')}>Upload Resume</button>
      </div>

      {isLoading ? (
        <div className="dashboard-grid dashboard-skeletons" aria-label="Loading dashboard">
          <div className="dashboard-card dashboard-skeleton" />
          <div className="dashboard-card dashboard-skeleton" />
          <div className="dashboard-card dashboard-skeleton dashboard-skeleton-wide" />
        </div>
      ) : error ? (
        <div className="dashboard-card dashboard-error" role="alert">
          <h2>We couldn’t load your dashboard</h2>
          <p>{error}</p>
          <button type="button" className="secondary-button" onClick={() => navigate('/analysis/history')}>View saved reports</button>
        </div>
      ) : reports.length === 0 ? (
        <div className="dashboard-empty-state">
          <span className="dashboard-empty-icon" aria-hidden="true">↑</span>
          <p className="eyebrow">Welcome to ResuMatch</p>
          <h2>Your first review starts here.</h2>
          <p>Upload a PDF or DOCX resume to get practical feedback on ATS readability, structure, and impact.</p>
          <button type="button" className="primary-button" onClick={() => navigate('/analysis')}>Upload your resume</button>
        </div>
      ) : (
        <div className="dashboard-grid">
          <section className="dashboard-upload-hero">
            <span className="dashboard-empty-icon" aria-hidden="true">↑</span>
            <h2>Analyze a new resume</h2>
            <p>Upload your resume for clear, tailored feedback in under a minute.</p>
            <button type="button" className="primary-button" onClick={() => navigate('/analysis')}>Upload your resume</button>
            <small>PDF or DOCX · Max 2 MB</small>
          </section>
          <div className="dashboard-grid dashboard-metrics-grid">
          <section className="dashboard-card dashboard-metric-card">
            <span className="dashboard-card-label">Resumes scanned</span>
            <strong>{reports.length}</strong>
            <p>Saved reports available.</p>
          </section>
          <section className="dashboard-card dashboard-metric-card">
            <span className="dashboard-card-label">Average ATS score</span>
            <strong>{averageScore}%</strong>
            <p>Across your saved analyses.</p>
          </section>
          </div>
          <section className="dashboard-card dashboard-reports-card">
            <div className="dashboard-card-heading">
              <div>
                <span className="dashboard-card-label">Recent analyses</span>
                <h2>Resume feedback at a glance</h2>
              </div>
              <button type="button" className="secondary-button" onClick={() => navigate('/analysis/history')}>View all</button>
            </div>
            <div className="dashboard-report-list">
              {recentReports.map((report) => (
                <button key={report.id} type="button" className="dashboard-report-row" onClick={() => navigate('/analysis/history')}>
                  <span className="dashboard-report-score">{report.overallScore}%</span>
                  <span className="dashboard-report-name"><strong>{report.originalFilename}</strong><small>{formatDate(report.createdAt)} · {report.scoreLabel}</small></span>
                  <span aria-hidden="true">→</span>
                </button>
              ))} 
            </div>
          </section>

          <section className="dashboard-card dashboard-upload-card">
            <span className="dashboard-card-label">Continue improving</span>
            <h2>Ready for another review?</h2>
            <p>Analyze an updated resume whenever you’re ready to measure your progress.</p>
            <button type="button" className="primary-button" onClick={() => navigate('/analysis')}>Upload a resume</button>
          </section>
        </div>
      )}
    </div>
  )
}

function AuthPage({ onSubmit }: AuthPageProps) {
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

  const onFormSubmit = async (event: React.FormEvent) => {
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

type DocumentsPageProps = {
  documents: DocumentSummary[]
  onDelete: (documentId: string) => Promise<void> | void
  onRefresh: () => Promise<void> | void
}

export function DocumentsPage({ documents, onDelete, onRefresh }: DocumentsPageProps) {
  const navigate = useNavigate()

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Documents</p>
          <h2>Your writing workspace</h2>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="empty-state">
          <h3>No documents yet</h3>
          <p>Your saved documents will appear here.</p>
        </div>
      ) : (
        <div className="document-grid">
          {documents.map((document) => (
            <article key={document.id} className="card">
              <div className="card-header-row">
                <div>
                  <h3>{document.title}</h3>
                  <p className="muted">Created {formatDate(document.createdAt)}</p>
                </div>
                <button
                  type="button"
                  className="icon-button danger"
                  onClick={() => {
                    if (window.confirm('Delete this document?')) {
                      void onDelete(document.id)
                    }
                  }}
                >
                  Delete
                </button>
              </div>

              <div className="meta-row">
                <span>Document ID {document.id.slice(0, 8)}</span>
              </div>

              <div className="button-row">
                <button type="button" className="secondary-button" onClick={() => navigate(`/documents/${document.id}`)}>
                  Open
                </button>
                <button type="button" className="secondary-button" onClick={() => void onRefresh()}>
                  Refresh
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

type DocumentEditorPageProps = {
  onSave: (id: string, payload: { title: string; content: string }) => Promise<void> | void
  onDelete: (documentId: string) => Promise<void> | void
  token: string
}

export function DocumentEditorPage({ onSave, onDelete, token }: DocumentEditorPageProps) {
  const navigate = useNavigate()
  const { documentId } = useParams()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [versionList, setVersionList] = useState<VersionSummary[]>([])
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(Boolean(documentId))

  useEffect(() => {
    const loadDocument = async () => {
      try {
        setIsLoading(true)
        const detail = await apiFetch<DocumentDetail>(`/api/v1/documents/${documentId}`, {}, token)
        setTitle(detail.title)
        setContent(detail.content)

        const versions = await apiFetch<VersionSummary[]>(`/api/v1/documents/${documentId}/versions`, {}, token)
        setVersionList(versions)
      } catch {
        setTitle('Document not found')
        setContent('')
        setVersionList([])
      } finally {
        setIsLoading(false)
      }
    }

    void loadDocument()
  }, [documentId, token])

  const handleSave = async () => {
    if (!documentId) return
    const nextTitle = title.trim() || 'Untitled document'
    const payload = { title: nextTitle, content }
    await onSave(documentId, payload)

    navigate('/documents')
  }

  const handleDelete = async () => {
    if (!documentId) {
      navigate('/documents')
      return
    }

    if (window.confirm('Delete this document permanently?')) {
      await onDelete(documentId)
      navigate('/documents')
    }
  }

  const handleCreateSnapshot = async () => {
    if (!documentId || !message.trim()) {
      return
    }

    try {
      await apiFetch(`/api/v1/documents/${documentId}/versions`, {
        method: 'POST',
        body: JSON.stringify({ message: message.trim() }),
      }, token)
      const nextVersions = await apiFetch<VersionSummary[]>(`/api/v1/documents/${documentId}/versions`, {}, token)
      setVersionList(nextVersions)
      setMessage('')
    } catch {
      // ignore snapshot failures here; parent state can surface errors
    }
  }

  const handleOpenVersion = async (versionId: string) => {
    if (!documentId) return

    try {
      const version = await apiFetch<VersionDetail>(`/api/v1/documents/${documentId}/versions/${versionId}`, {}, token)
      setContent(version.content)
    } catch {
      // ignore open failures
    }
  }

  const handleRevert = async (versionId: string) => {
    if (!documentId) return

    try {
      await apiFetch(`/api/v1/documents/${documentId}/versions/${versionId}/revert`, { method: 'POST' }, token)
      const detail = await apiFetch<DocumentDetail>(`/api/v1/documents/${documentId}`, {}, token)
      setTitle(detail.title)
      setContent(detail.content)
      const nextVersions = await apiFetch<VersionSummary[]>(`/api/v1/documents/${documentId}/versions`, {}, token)
      setVersionList(nextVersions)
    } catch {
      // ignore revert failures
    }
  }

  return (
    <div className="page-shell">
      <div className="page-header narrow-header">
        <div>
          <p className="eyebrow">Document detail</p>
          <h2>{title || 'Untitled document'}</h2>
        </div>
        <div className="button-row">
          <button type="button" className="secondary-button" onClick={() => navigate('/documents')}>
            Cancel
          </button>
          <button type="button" className="primary-button" onClick={() => void handleSave()}>
            Save
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="empty-state compact">
          <h3>Loading document…</h3>
        </div>
      ) : (
        <div className="editor-layout">
          <div className="panel">
            <label className="field-label">
              <span>Document title</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>

            <label className="field-label">
              <span>Content</span>
              <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={16} />
            </label>

            <div className="danger-zone">
              <button type="button" className="danger-button" onClick={() => void handleDelete()}>
                Delete document
              </button>
            </div>
          </div>

          <div className="panel">
            <h3>Version history</h3>

            <>
                <div className="version-form">
                  <input
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Snapshot message"
                  />
                  <button type="button" className="secondary-button" onClick={() => void handleCreateSnapshot()}>
                    Save snapshot
                  </button>
                </div>

                <div className="version-list">
                  {versionList.length === 0 ? (
                    <p className="muted">No versions recorded yet.</p>
                  ) : (
                    versionList.map((version) => (
                      <div key={version.id} className="version-item">
                        <div>
                          <strong>{version.message}</strong>
                          <p>{formatDate(version.createdAt)}</p>
                        </div>
                        <div className="mini-actions">
                          <button type="button" className="secondary-button" onClick={() => void handleOpenVersion(version.id)}>
                            Open
                          </button>
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => {
                              if (window.confirm('Revert to this version? A new revision will be created.')) {
                                void handleRevert(version.id)
                              }
                            }}
                          >
                            Revert
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
          </div>
        </div>
      )}
    </div>
  )
}

type ApplicationsPageProps = {
  applications: Application[]
}

export function ApplicationsPage({ applications }: ApplicationsPageProps) {
  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Applications</p>
          <h2>Job tracking</h2>
        </div>
      </div>

      <div className="alert-banner">
        The application tracker is ready for the backend API, but the application controller does not appear
        to expose save endpoints in the current schema. This screen is intentionally read-only until the API is added.
      </div>

      <div className="table-panel">
        <table>
          <thead>
            <tr>
              <th>Role</th>
              <th>Company</th>
              <th>Status</th>
              <th>Date</th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => (
              <tr key={application.id}>
                <td>{application.position}</td>
                <td>{application.company}</td>
                <td>
                  <span className={`status-pill ${application.status.toLowerCase()}`}>{application.status}</span>
                </td>
                <td>{formatDate(application.date)}</td>
                <td>
                  <a href={application.url} target="_blank" rel="noreferrer">
                    Open
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

type ResumeAnalysisPageProps = {
  onResult: (result: AnalysisResult | null) => void
  initialResult: AnalysisResult | null
  token: string | null
}

function ResumeAnalysisPage({ onResult, initialResult, token }: ResumeAnalysisPageProps) {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!loading || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const interval = window.setInterval(() => {
      setLoadingStep((current) => (current + 1) % ANALYSIS_LOADING_MESSAGES.length)
    }, 1100)
    return () => window.clearInterval(interval)
  }, [loading])

  const handleAnalyze = async () => {
    if (!file) {
      setError('Choose a PDF or DOCX resume to continue.')
      return
    }

    if (!/\.(pdf|docx)$/i.test(file.name)) {
      setError('Only PDF and DOCX files are supported.')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Please upload a file under 2 MB.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const result = await apiFetch<AnalysisResult>('/api/v1/resume-analysis/analyze', {
        method: 'POST',
        body: formData,
      }, token)
      onResult(result)
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 429) {
        setError('You have reached your current analysis limit. Please try again after your limit resets.')
      } else {
        setError(requestError instanceof Error ? requestError.message : 'Unable to analyze this resume. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Resume analysis</p>
          <h2>Get a detailed resume review</h2>
        </div>
      </div>

      <div className="analysis-layout">
        <div className="panel analysis-form-panel">
          <label className="field-label">
            <span>Resume file</span>
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null)
                setError('')
              }}
            />
          </label>
          <p className="muted">Upload a text-based PDF or DOCX file, up to 2 MB.</p>

          <button type="button" className="primary-button" onClick={() => void handleAnalyze()} disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze resume'}
          </button>
          {error ? <div className="inline-banner" role="alert">{error}</div> : null}
          {loading ? (
            <div className="scan-status" role="status" aria-live="polite">
              <div className="scan-frame">
                <span className="scan-corner scan-corner-tl" />
                <span className="scan-corner scan-corner-tr" />
                <span className="scan-corner scan-corner-bl" />
                <span className="scan-corner scan-corner-br" />
                <span className="scan-document-mark">CV</span>
              </div>
              <p className="mono-label">{ANALYSIS_LOADING_MESSAGES[loadingStep]}</p>
            </div>
          ) : null}
        </div>

        <div className="panel analysis-results-panel report-surface">
          {initialResult ? (
            <div className="results-layout analysis-report">
              <aside className="score-card score-dashboard">
                <div>
                  <span className="score-label">ATS match score</span>
                  <strong>{initialResult.overallScore}%</strong>
                </div>
                <div className="score-dashboard-meta">
                  <span className="result-badge pass">{initialResult.scoreLabel}</span>
                  <p>Based on your resume’s structure, content, and ATS signals.</p>
                </div>
              </aside>

              <div className="results-sections report-card-grid">
                <section className="analysis-details report-detail-card report-summary-card">
                  <span className="mono-label">01 / SUMMARY</span>
                  <h3>What to focus on</h3>
                  <p>{initialResult.report.summary}</p>
                </section>

                <section className="analysis-details report-detail-card">
                  <span className="mono-label">02 / SCORE BREAKDOWN</span>
                  <h3>Review areas</h3>
                  {initialResult.report.parameters.length > 0 ? (
                    <ul className="issue-list">
                      {initialResult.report.parameters.map((item) => (
                        <li key={item.parameter}>
                          <div className="report-list-title">
                            <strong>{item.parameter.replaceAll('_', ' ')}</strong>
                            <span className={`result-badge ${item.score >= 75 ? 'pass' : 'attention'}`}>{item.score}%</span>
                          </div>
                          <p>{item.summary}</p>
                        </li>
                      ))}
                    </ul>
                  ) : <p>No parameter scores were returned for this analysis.</p>}
                </section>

                <section className="analysis-details report-detail-card">
                  <span className="mono-label">03 / PRIORITY FIXES</span>
                  <h3>Make the biggest improvements first</h3>
                  {initialResult.report.issues.map((issue, index) => (
                    <div className="report-entry" key={`${issue.parameter}-${index}`}>
                      <div className="report-list-title">
                        <strong>{issue.parameter.replaceAll('_', ' ')}</strong>
                        <span className={`result-badge ${issue.severity === 'HIGH' ? 'critical' : 'attention'}`}>{issue.severity}</span>
                      </div>
                      <p>{issue.problem}</p>
                      <p><strong>Fix:</strong> {issue.fix}</p>
                      {issue.rewrite ? <p><strong>Suggested rewrite:</strong> {issue.rewrite}</p> : null}
                    </div>
                  ))}
                </section>

                <section className="analysis-details report-detail-card">
                  <span className="mono-label">04 / ACTION PLAN</span>
                  <h3>Next steps</h3>
                  {initialResult.report.actionPlan.map((action) => (
                    <div className="report-entry" key={`${action.priority}-${action.title}`}>
                      <div className="report-list-title">
                        <strong>{action.priority}. {action.title}</strong>
                        <span className={`result-badge ${action.impact === 'HIGH' ? 'attention' : 'pass'}`}>{action.impact}</span>
                      </div>
                      <p>{action.details} {action.timeEstimate ? `(${action.timeEstimate})` : ''}</p>
                    </div>
                  ))}
                </section>
                {initialResult.report.missingMaterial.length > 0 ? (
                  <section className="analysis-details report-detail-card">
                    <span className="mono-label">05 / MISSING MATERIAL</span>
                    <h3>Strengthen the evidence</h3>
                    {initialResult.report.missingMaterial.map((item) => (
                      <div className="report-entry" key={item.type}>
                        <div className="report-list-title">
                          <strong>{item.type.replaceAll('_', ' ')}</strong>
                          <span className="result-badge critical">Missing</span>
                        </div>
                        <p>{item.whyItMatters}</p>
                        <p><strong>How to add it:</strong> {item.howToAdd}</p>
                      </div>
                    ))}
                  </section>
                ) : null}
                {!token ? (
                  <section className="analysis-details report-detail-card report-registration-card">
                    <span className="mono-label">SAVE YOUR PROGRESS</span>
                    <h3>Register for saved reports</h3>
                    <p>Create an account to keep your analysis history and access career-management tools.</p>
                    <button type="button" className="secondary-button" onClick={() => navigate('/auth')}>Create account</button>
                  </section>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="empty-state compact">
              <h3>Waiting for analysis</h3>
              <p>Upload your resume to receive a detailed review.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

type AnalysisHistoryPageProps = {
  token: string
}

function AnalysisHistoryPage({ token }: AnalysisHistoryPageProps) {
  const [reports, setReports] = useState<AnalysisResult[]>([])
  const [selectedReport, setSelectedReport] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadHistory = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const items = await apiFetch<AnalysisResult[]>('/api/v1/resume-analysis', {}, token)
      setReports(items)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load your analysis history.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  const openReport = async (id: number) => {
    setError('')
    try {
      const report = await apiFetch<AnalysisResult>(`/api/v1/resume-analysis/${id}`, {}, token)
      setSelectedReport(report)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to open this report.')
    }
  }

  const deleteReport = async (id: number) => {
    if (!window.confirm('Delete this saved analysis permanently?')) return

    setError('')
    try {
      await apiFetch<void>(`/api/v1/resume-analysis/${id}`, { method: 'DELETE' }, token)
      setReports((current) => current.filter((report) => report.id !== id))
      if (selectedReport?.id === id) setSelectedReport(null)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to delete this report.')
    }
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Saved reports</p>
          <h2>Analysis history</h2>
        </div>
        <button type="button" className="secondary-button" onClick={() => void loadHistory()} disabled={loading}>
          Refresh
        </button>
      </div>

      {error ? <div className="inline-banner" role="alert">{error}</div> : null}

      {loading ? (
        <div className="empty-state compact"><h3>Loading reports…</h3></div>
      ) : reports.length === 0 ? (
        <div className="empty-state compact">
          <h3>No saved analyses yet</h3>
          <p>Run an analysis while signed in and it will appear here.</p>
        </div>
      ) : (
        <div className="table-panel">
          <table>
            <thead>
              <tr><th>Resume</th><th>Score</th><th>Created</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>{report.originalFilename}</td>
                  <td>{report.overallScore}% · {report.scoreLabel}</td>
                  <td>{formatDate(report.createdAt)}</td>
                  <td>
                    <div className="mini-actions">
                      <button type="button" className="secondary-button" onClick={() => report.id !== null && void openReport(report.id)}>Open</button>
                      <button type="button" className="danger-button" onClick={() => report.id !== null && void deleteReport(report.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedReport ? (
        <div className="panel">
          <div className="page-header narrow-header">
            <div>
              <p className="eyebrow">Report detail</p>
              <h3>{selectedReport.originalFilename} · {selectedReport.overallScore}%</h3>
            </div>
            <button type="button" className="secondary-button" onClick={() => setSelectedReport(null)}>Close</button>
          </div>
          <section className="analysis-details">
            <h3>Summary</h3>
            <p>{selectedReport.report.summary}</p>
          </section>
          {selectedReport.report.parameters.length > 0 ? (
            <section className="analysis-details">
              <h3>Score breakdown</h3>
              {selectedReport.report.parameters.map((parameter) => (
                <div key={parameter.parameter}>
                  <strong>{parameter.parameter.replaceAll('_', ' ')} · {parameter.score}%</strong>
                  <p>{parameter.summary}</p>
                </div>
              ))}
            </section>
          ) : null}
          {selectedReport.report.issues.map((issue, index) => (
            <section className="analysis-details" key={`${issue.parameter}-${index}`}>
              <h3>{issue.parameter.replaceAll('_', ' ')}</h3>
              <p>{issue.problem}</p>
              <p><strong>Fix:</strong> {issue.fix}</p>
              {issue.rewrite ? <p><strong>Suggested rewrite:</strong> {issue.rewrite}</p> : null}
            </section>
          ))}
          {selectedReport.report.missingMaterial.length > 0 ? (
            <section className="analysis-details">
              <h3>Missing material</h3>
              {selectedReport.report.missingMaterial.map((item) => (
                <div key={item.type}>
                  <strong>{item.type.replaceAll('_', ' ')}</strong>
                  <p>{item.whyItMatters}</p>
                  <p><strong>How to add it:</strong> {item.howToAdd}</p>
                </div>
              ))}
            </section>
          ) : null}
          {selectedReport.report.actionPlan.length > 0 ? (
            <section className="analysis-details">
              <h3>Action plan</h3>
              {selectedReport.report.actionPlan.map((action) => (
                <div key={`${action.priority}-${action.title}`}>
                  <strong>{action.priority}. {action.title} · {action.impact}</strong>
                  <p>{action.details} {action.timeEstimate ? `(${action.timeEstimate})` : ''}</p>
                </div>
              ))}
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

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

export default App

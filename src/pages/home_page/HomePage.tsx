import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconHome, IconRoute, IconFileAnalytics, IconLogin } from '@tabler/icons-react'
import { FloatingNav, type NavItem } from 'C:/NPC/ResuMatchFrontend/src/components/FloatingNav.tsx'


const navItems: NavItem[] = [
  { name: 'Home', link: '#', icon: <IconHome size={16} /> },
  { name: 'The approach', link: '#approach', icon: <IconRoute size={16} /> },
  { name: 'Sample reports', link: '#sample-reports', icon: <IconFileAnalytics size={16} /> },
  { name: 'Sign in', link: '/auth', icon: <IconLogin size={16} /> },
]
export default function HomePage() {
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
        <FloatingNav navItems={navItems} />
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



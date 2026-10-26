export const steps = [
  { number: '01', title: 'Upload', detail: 'Start with the experience you already have.', metric: 'FORMAT CHECK: 6 / 7 SIGNALS', missing: 'Missing: measurable outcomes', fix: 'Fix: lead one bullet with scope and result.' },
  { number: '02', title: 'ATS score', detail: 'See how clearly your profile reads to a parser.', metric: 'ATS READABILITY: 74 / 100', missing: 'Missing keyword: stakeholder management', fix: 'Fix: use the exact role language where it is accurate.' },
  { number: '03', title: 'Keyword match', detail: 'Find the role requirements your resume may be missing.', metric: 'ROLE MATCH: 8 / 11 KEYWORDS', missing: 'Missing keyword: experimentation', fix: 'Fix: connect a project to a test, learning, or decision.' },
  { number: '04', title: 'Fixes', detail: 'Leave with specific improvements, not vague advice.', metric: 'PRIORITY FIX: HIGH IMPACT', missing: 'Review: impact is implied in 2 bullets', fix: 'Fix: name the outcome before describing the work.' },
]

export const stories = [
  { eyebrow: '01 / READABILITY', title: 'Make the first read count.', detail: 'A clear structure gives recruiters and screening systems a better chance of finding the experience that matters.', highlight: 'Structure & hierarchy', output: 'Section order is clear. Move the strongest result into the first bullet.' },
  { eyebrow: '02 / RELEVANCE', title: 'Put the right skills in view.', detail: 'Compare your resume with a role description to spot the language and capabilities that are not coming through.', highlight: 'Role-specific keywords', output: 'Missing keyword: experimentation. Add it only where your experience supports it.' },
  { eyebrow: '03 / IMPACT', title: 'Show the value behind the work.', detail: 'Bring outcomes forward. Specific scope and measurable results make your contribution easier to understand.', highlight: 'Evidence of impact', output: '2 bullets describe work without a result. Add a metric, decision, or customer outcome.' },
  { eyebrow: '04 / NEXT STEPS', title: 'Turn feedback into action.', detail: 'Prioritize a short list of practical edits and refine your profile with a clearer direction.', highlight: 'Actionable recommendations', output: 'Quick win: rewrite the onboarding bullet to lead with its retention result.' },
]

export const sampleReports = [
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
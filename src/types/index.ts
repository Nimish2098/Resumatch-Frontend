export type User = {
  id?: number
  name: string
  email: string
}

export type DocumentSummary = { id: string; title: string; createdAt: string }
export type DocumentDetail = { id: string; title: string; content: string; createdAt: string; updatedAt: string }
export type VersionSummary = { id: string; message: string; createdAt: string }
export type VersionDetail = { id: string; documentId: string; message: string; content: string; createdAt: string }

export type AnalysisResult = {
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

export type ApplicationStatus = 'APPLIED' | 'REJECTED' | 'INTERVIEW'
export type Application = { id: string; position: string; company: string; status: ApplicationStatus; date: string; url: string }

export type AuthResponse = {
  accessToken: string
  tokenType?: string
  userId: number
  name: string
  email: string
}
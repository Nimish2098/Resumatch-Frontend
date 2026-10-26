import { apiRequest } from './client'

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string | null,
): Promise<T> {
  return apiRequest<T>(path, options, accessToken)
}
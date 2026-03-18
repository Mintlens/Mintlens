'use client'

import { useAuthStore } from '@/store/auth.store'
import { useProjects } from '@/hooks/use-projects'

/**
 * Returns the selected projectId along with a `waiting` flag.
 * `waiting` is true when we're still loading projects or when auto-select
 * hasn't run yet (projectId is null but projects exist).
 *
 * Use this instead of raw `useAuthStore` to avoid the race condition
 * where pages render "no project" before ProjectAutoSelect has run.
 */
export function useReadyProject() {
  const projectId = useAuthStore((s) => s.selectedProjectId)
  const { data: projects, isLoading: loadingProjects } = useProjects()

  const waiting = !projectId && (loadingProjects || (projects != null && projects.length > 0))

  return { projectId, waiting }
}

'use client'

import { useEffect } from 'react'
import { useProjects } from '@/hooks/use-projects'
import { useAuthStore } from '@/store/auth.store'

/**
 * Invisible component that auto-selects the first project
 * if none is currently selected. This ensures sub-pages
 * (cost-explorer, requests, tenants, budgets, api-keys)
 * have a selectedProjectId available.
 */
export function ProjectAutoSelect() {
  const { data: projects } = useProjects()
  const selectedProjectId  = useAuthStore((s) => s.selectedProjectId)
  const setSelectedProject = useAuthStore((s) => s.setSelectedProject)

  useEffect(() => {
    if (!selectedProjectId && projects && projects.length > 0) {
      setSelectedProject(projects[0]!.id)
    }
  }, [projects, selectedProjectId, setSelectedProject])

  return null
}

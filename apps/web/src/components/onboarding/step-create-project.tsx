'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateProject } from '@/hooks/use-projects'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'

interface StepCreateProjectProps {
  onComplete: (projectId: string) => void
}

export function StepCreateProject({ onComplete }: StepCreateProjectProps) {
  const [name, setName] = useState('')
  const createProject = useCreateProject()
  const setSelectedProject = useAuthStore((s) => s.setSelectedProject)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    try {
      const project = await createProject.mutateAsync({ name: name.trim() })
      setSelectedProject(project.id)
      toast.success('Project created')
      onComplete(project.id)
    } catch {
      toast.error('Failed to create project')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Create your first project</h2>
        <p className="mt-1 text-sm text-slate-500">
          A project groups all LLM usage for one application or service.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="project-name">Project name</Label>
          <Input
            id="project-name"
            placeholder="e.g. My AI Chatbot"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>
        <Button type="submit" variant="primary" disabled={createProject.isPending || !name.trim()}>
          {createProject.isPending ? 'Creating...' : 'Create project'}
        </Button>
      </form>
    </div>
  )
}

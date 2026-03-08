'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthStore {
  selectedProjectId: string | null
  setSelectedProject: (id: string) => void
  clearProject: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      selectedProjectId: null,
      setSelectedProject: (id) => set({ selectedProjectId: id }),
      clearProject: () => set({ selectedProjectId: null }),
    }),
    { name: 'mintlens-project' },
  ),
)

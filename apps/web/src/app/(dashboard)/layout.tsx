import { Suspense } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/top-bar'
import { ProjectAutoSelect } from '@/components/layout/project-auto-select'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard-gradient flex h-screen overflow-hidden">
      {/* Sidebar — transparent, floating on gradient */}
      <Sidebar />

      {/* Floating canvas — main content area */}
      <div className="flex flex-1 flex-col p-4 pl-0">
        <div className="floating-canvas flex flex-1 flex-col overflow-hidden">
          {/* Top bar — inset rounded pill */}
          <Suspense>
            <TopBar />
          </Suspense>

          {/* Auto-select first project for sub-pages that need it */}
          <ProjectAutoSelect />

          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

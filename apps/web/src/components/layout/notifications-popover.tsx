'use client'

import * as Popover from '@radix-ui/react-popover'
import { Bell, AlertTriangle, Check } from 'lucide-react'
import { useAlerts, useMarkAlertRead } from '@/hooks/use-alerts'
import { cn } from '@/lib/cn'

export function NotificationsPopover() {
  const { data } = useAlerts()
  const { mutate: markRead } = useMarkAlertRead()
  const unreadCount = data?.unreadCount ?? 0
  const alerts = data?.alerts ?? []

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-all duration-200 hover:bg-black/[0.04] hover:text-slate-600"
          title="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-80 rounded-2xl border border-slate-100 bg-white shadow-xl animate-in fade-in-0 zoom-in-95"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-800">Notifications</p>
            {unreadCount > 0 && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600">
                {unreadCount} new
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-slate-400">
                <Bell className="h-6 w-6 text-slate-200" />
                <p className="text-xs">No notifications yet</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <button
                  key={alert.id}
                  onClick={() => { if (!alert.readAt) markRead(alert.id) }}
                  className={cn(
                    'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50',
                    !alert.readAt && 'bg-mint-50/30',
                  )}
                >
                  <div className={cn(
                    'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                    alert.threshold >= 100 ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500',
                  )}>
                    <AlertTriangle className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-700">
                      {alert.budgetName} hit {alert.threshold}%
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {alert.projectName} · {alert.period}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-300">
                      {alert.firedAt ? new Date(alert.firedAt).toLocaleDateString() : ''}
                    </p>
                  </div>
                  {alert.readAt && (
                    <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-300" />
                  )}
                </button>
              ))
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

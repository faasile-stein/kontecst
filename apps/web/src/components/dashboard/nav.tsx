'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Package,
  Search,
  Settings,
  LogOut,
  LayoutDashboard,
  FileText,
  Rss,
  TrendingUp,
  Users,
  Shield,
  Database,
  Github,
  ClipboardCheck,
  KeyRound,
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'

interface NavProps {
  user: User
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Packages', href: '/dashboard/packages', icon: Package },
  { name: 'Files', href: '/dashboard/files', icon: FileText },
  { name: 'Search', href: '/dashboard/search', icon: Search },
  { name: 'GitHub', href: '/dashboard/github', icon: Github },
  { name: 'Reviews', href: '/dashboard/reviews', icon: ClipboardCheck },
  { name: 'Analytics', href: '/dashboard/analytics', icon: TrendingUp },
  { name: 'Team', href: '/dashboard/team', icon: Users },
  { name: 'Audit Log', href: '/dashboard/audit', icon: Shield },
  { name: 'SSO', href: '/dashboard/sso', icon: KeyRound },
  { name: 'Admin', href: '/dashboard/admin', icon: Database },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function DashboardNav({ user }: NavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex w-64 flex-col bg-white border-r border-neutral-300">
      {/* Logo/Header */}
      <div className="flex h-16 items-center px-6 border-b border-neutral-300">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gradient shadow-sm">
            <span className="text-base font-bold text-white">K</span>
          </div>
          <span className="text-xl font-bold text-neutral-900 group-hover:text-brand transition-colors duration-120">
            Kontecst
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md',
                'transition-all duration-120',
                isActive
                  ? 'bg-brand/5 text-brand'
                  : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-brand-gradient rounded-r-full" />
              )}

              <item.icon
                className={cn(
                  'h-5 w-5 flex-shrink-0 transition-colors duration-120',
                  isActive ? 'text-brand' : 'text-neutral-500 group-hover:text-neutral-700'
                )}
                aria-hidden="true"
              />
              <span className="flex-1">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-neutral-300 p-4">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient shadow-sm">
            <span className="text-sm font-semibold text-white">
              {user.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-neutral-900">
              {user.user_metadata?.full_name || 'User'}
            </p>
            <p className="truncate text-xs text-neutral-600">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 rounded-md transition-colors duration-120"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          Sign out
        </button>
      </div>
    </div>
  )
}

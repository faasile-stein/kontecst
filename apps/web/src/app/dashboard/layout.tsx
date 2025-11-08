import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { DashboardNav } from '@/components/dashboard/nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <div className="flex min-h-screen">
      <DashboardNav user={user} />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="container mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  )
}

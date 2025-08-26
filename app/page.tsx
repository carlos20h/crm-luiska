import { supabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const s = supabaseServer()
  if (!s) return <main className="p-6">Supabase not configured</main>
  const { data: { user } } = await s.auth.getUser()
  redirect(user ? '/kanban' : '/login')
}

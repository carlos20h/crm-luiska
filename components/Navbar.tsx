'use client'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase-browser'

export default function Navbar() {
  const s = supabaseBrowser()
  async function logout() {
    await s?.auth.signOut()
    location.href = '/login'
  }
  return (
    <nav className="p-4 bg-white border-b mb-4">
      <ul className="flex gap-4 items-center">
        <li><Link href="/kanban" className="font-medium">Kanban</Link></li>
        <li><Link href="/contacts" className="font-medium">Contactos</Link></li>
        <li><Link href="/tasks" className="font-medium">Tareas</Link></li>
        <li className="ml-auto"><button onClick={logout} className="text-sm text-red-600">Salir</button></li>
      </ul>
    </nav>
  )
}

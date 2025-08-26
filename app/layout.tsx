import './globals.css'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import { supabaseServer } from '@/lib/supabase-server'

export const metadata: Metadata = {
  title: 'CRM Luis Ka',
  description: 'Embudo Ahorro/GMM — Grupo Tres Hermosillo',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = supabaseServer()
  const { data: { user } } = s ? await s.auth.getUser() : { data: { user: null } }
  return (
    <html lang="es">
      <body className="bg-gray-50 text-gray-900">
        {user && <Navbar />}
        {children}
      </body>
    </html>
  )
}


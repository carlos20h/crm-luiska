'use client'
import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

export default function Login() {
  const s = supabaseBrowser()
  const r = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErr(null)
    if (!s) {
      setErr('Supabase not configured')
      return
    }
    const { error } = await s.auth.signInWithPassword({ email, password })
    if (error) {
      setErr(error.message)
      return
    }
    r.push('/kanban')
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-3 border rounded-2xl p-6 bg-white">
        <h1 className="text-xl font-semibold">Iniciar sesión</h1>
        <input className="w-full border rounded p-2" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="w-full border rounded p-2" type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button type="submit" className="w-full rounded-xl p-2 bg-[#004184] text-white">Entrar</button>
      </form>
    </main>
  )
}

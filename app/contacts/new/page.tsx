'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase-browser'

export default function NewContact() {
  const s = supabaseBrowser()
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [sourceId, setSourceId] = useState('')
  const [err, setErr] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErr(null)
    if (!s) {
      setErr('Supabase not configured')
      return
    }
    const { error } = await s.from('contacts').insert({
      first_name: firstName,
      last_name: lastName,
      phone,
      email,
      city,
      source_id: sourceId
    })
    if (error) {
      setErr(error.message)
      return
    }
    router.push('/contacts')
  }

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold mb-4">Nuevo Contacto</h1>
      <form onSubmit={onSubmit} className="max-w-md space-y-3">
        <input className="w-full border rounded p-2" placeholder="Nombre" value={firstName} onChange={e => setFirstName(e.target.value)} />
        <input className="w-full border rounded p-2" placeholder="Apellido" value={lastName} onChange={e => setLastName(e.target.value)} />
        <input className="w-full border rounded p-2" placeholder="Teléfono" value={phone} onChange={e => setPhone(e.target.value)} />
        <input className="w-full border rounded p-2" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="w-full border rounded p-2" placeholder="Ciudad" value={city} onChange={e => setCity(e.target.value)} />
        <input className="w-full border rounded p-2" placeholder="Fuente" value={sourceId} onChange={e => setSourceId(e.target.value)} />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button type="submit" className="rounded-xl p-2 bg-[#004184] text-white">Guardar</button>
      </form>
    </main>
  )
}


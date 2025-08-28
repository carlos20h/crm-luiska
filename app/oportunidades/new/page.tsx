'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase-browser'

export default function NewOpportunity() {
  const s = supabaseBrowser()
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [interest, setInterest] = useState('')
  const [amount, setAmount] = useState('')
  const [sourceId, setSourceId] = useState('')
  const [sources, setSources] = useState<{ id: number; name: string }[]>([])
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!s) return
    s
      .from('sources')
      .select('id,name')
      .order('id')
      .then(({ data, error }) => {
        if (!data || data.length === 0 || error) {
          setSources([
            { id: 1, name: 'Ads' },
            { id: 2, name: 'Referido' },
            { id: 3, name: 'Alianza' },
            { id: 4, name: 'Orgánico' },
          ])
        } else {
          setSources(data)
        }
      })
  }, [s])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErr(null)
    if (!s) {
      setErr('Supabase not configured')
      return
    }
    const { data: { user } } = await s.auth.getUser()
    if (!user) {
      setErr('No user')
      return
    }
    const { data: contactId, error: upsertErr } = await s.rpc('upsert_contact', {
      p_first: firstName || null,
      p_last: lastName || null,
      p_phone: phone || null,
      p_email: email || null,
      p_city: city || null,
      p_source: sourceId ? Number(sourceId) : null,
      p_owner: user.id,
    })
    if (upsertErr) {
      setErr(upsertErr.message)
      return
    }
    const { error: oppErr } = await s.rpc('create_opportunity', {
      p_contact_id: contactId,
      p_interest: interest,
      p_amount: amount ? Number(amount) : null,
      p_source: sourceId ? Number(sourceId) : null,
      p_owner: user.id,
    })
    if (oppErr) {
      setErr(oppErr.message)
      return
    }
    router.push('/oportunidades')
  }

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold mb-4">Nueva Oportunidad</h1>
      <form onSubmit={onSubmit} className="max-w-md space-y-3">
        <input className="w-full border rounded p-2" placeholder="Nombre" value={firstName} onChange={e => setFirstName(e.target.value)} />
        <input className="w-full border rounded p-2" placeholder="Apellido" value={lastName} onChange={e => setLastName(e.target.value)} />
        <input className="w-full border rounded p-2" placeholder="Teléfono" value={phone} onChange={e => setPhone(e.target.value)} />
        <input className="w-full border rounded p-2" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="w-full border rounded p-2" placeholder="Ciudad" value={city} onChange={e => setCity(e.target.value)} />
        <select className="w-full border rounded p-2" value={interest} onChange={e => setInterest(e.target.value)}>
          <option value="">Interés</option>
          <option value="Ahorro">Ahorro</option>
          <option value="GMM">GMM</option>
          <option value="Ambos">Ambos</option>
        </select>
        <input type="number" step="0.01" className="w-full border rounded p-2" placeholder="Monto estimado" value={amount} onChange={e => setAmount(e.target.value)} />
        <select className="w-full border rounded p-2" value={sourceId} onChange={e => setSourceId(e.target.value)}>
          <option value="">Fuente</option>
          {sources.map(s => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button type="submit" className="rounded-xl p-2 bg-[#004184] text-white">Guardar</button>
      </form>
    </main>
  )
}


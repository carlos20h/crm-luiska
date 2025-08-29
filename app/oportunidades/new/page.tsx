'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase-browser'

type Contact = { id: string; name: string }
type Source = { id: number; name: string }

export default function NewOpportunity() {
  const s = supabaseBrowser()
  const router = useRouter()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [sources, setSources] = useState<Source[]>([])
  const [contactId, setContactId] = useState('')
  const [interest, setInterest] = useState('')
  const [amount, setAmount] = useState('')
  const [probability, setProbability] = useState('')
  const [nextStep, setNextStep] = useState('')
  const [sourceId, setSourceId] = useState('')
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!s) return
    s
      .from('contacts')
      .select('id,first_name,last_name')
      .then(({ data }) => {
        const mapped = data?.map((c: any) => ({
          id: c.id,
          name: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim(),
        }))
        setContacts(mapped ?? [])
      })
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
            { id: 4, name: "Orgánico" },
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
    const { data: oppId, error: oppErr } = await s.rpc('create_opportunity', {
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
    if (probability || nextStep) {
      const updates: any = {}
      if (probability) updates.probability = Number(probability)
      if (nextStep) updates.next_step_at = new Date(nextStep).toISOString()
      await s.from('opportunities').update(updates).eq('id', oppId)
    }
    router.push('/oportunidades')
  }

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold mb-4">Nueva Oportunidad</h1>
      <form onSubmit={onSubmit} className="max-w-md space-y-3">
        <select
          className="w-full border rounded p-2"
          value={contactId}
          onChange={e => setContactId(e.target.value)}
        >
          <option value="">Contacto</option>
          {contacts.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className="w-full border rounded p-2"
          value={interest}
          onChange={e => setInterest(e.target.value)}
        >
          <option value="">Interés</option>
          <option value="Ahorro">Ahorro</option>
          <option value="GMM">GMM</option>
          <option value="Ambos">Ambos</option>
        </select>
        <input
          type="number"
          step="0.01"
          className="w-full border rounded p-2"
          placeholder="Monto estimado"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
        <input
          type="number"
          className="w-full border rounded p-2"
          placeholder="Probabilidad"
          value={probability}
          onChange={e => setProbability(e.target.value)}
        />
        <input
          type="datetime-local"
          className="w-full border rounded p-2"
          placeholder="Próximo paso"
          value={nextStep}
          onChange={e => setNextStep(e.target.value)}
        />
        <select
          className="w-full border rounded p-2"
          value={sourceId}
          onChange={e => setSourceId(e.target.value)}
        >
          <option value="">Fuente</option>
          {sources.map(s => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button type="submit" className="rounded-xl p-2 bg-[#004184] text-white">
          Guardar
        </button>
      </form>
    </main>
  )
}


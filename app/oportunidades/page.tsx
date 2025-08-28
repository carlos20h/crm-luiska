import { supabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

type Stage = { id: string; name: string; position: number }
type Card = {
  id: string; contact: string; interest: 'Ahorro'|'GMM'|'Ambos'
  amount_estimated: number | null; next_step_at: string
  stage: string
}

export default async function Oportunidades() {
  const s = supabaseServer()
  if (!s) {
    return <main className="p-6">Supabase not configured</main>
  }
  const { data: { user } } = await s.auth.getUser()
  if (!user) redirect('/login')
  const { data: stages } = await s.from('public.stages').select('id,name,position').order('position')
  const { data: opps }   = await s.from('public.v_opps_kanban').select('*')

  const grouped: Record<string, Card[]> = {}
  stages?.forEach((st: Stage) => (grouped[st.name] = []))
  opps?.forEach((o: any) => { (grouped[o.stage] ||= []).push(o as Card) })

  return (
    <main className="p-6">
      <div className="mb-4">
        <Link href="/oportunidades/new" className="inline-block rounded-xl bg-[#004184] px-4 py-2 text-white">
          Nueva Oportunidad
        </Link>
      </div>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {stages?.map((st: Stage) => (
          <section key={st.id} className="bg-white border rounded-2xl p-3">
            <h2 className="font-semibold mb-2">{st.position}. {st.name}</h2>
            <div className="space-y-2">
              {grouped[st.name]?.map((card: Card) => (
                <article key={card.id} className="border rounded-xl p-3">
                  <div className="text-sm font-medium">{card.contact}</div>
                  <div className="text-xs text-gray-500">
                    {card.interest} · ${card.amount_estimated ?? 0}
                  </div>
                  <div className="text-xs">
                    Próx. paso: {new Date(card.next_step_at).toLocaleString()}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}

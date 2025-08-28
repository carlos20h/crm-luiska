import { supabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function Tasks() {
  const s = supabaseServer()
  if (!s) return <main className="p-6">Supabase not configured</main>
  const { data: { user } } = await s.auth.getUser()
  if (!user) redirect('/login')
  const { data: tasks } = await s
    .from('tasks')
    .select('id,title,due_at,status,priority')
    .order('due_at')

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold mb-4">Tareas</h1>
      <div className="overflow-auto">
        <table className="min-w-full border bg-white text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Título</th>
              <th className="p-2 border">Fecha límite</th>
              <th className="p-2 border">Prioridad</th>
              <th className="p-2 border">Estado</th>
            </tr>
          </thead>
          <tbody>
            {tasks?.map(t => (
              <tr key={t.id}>
                <td className="p-2 border">{t.title}</td>
                <td className="p-2 border">{new Date(t.due_at).toLocaleString()}</td>
                <td className="p-2 border">{t.priority}</td>
                <td className="p-2 border">{t.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}

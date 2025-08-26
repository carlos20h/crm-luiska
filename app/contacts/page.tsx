import { supabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function Contacts() {
  const s = supabaseServer()
  if (!s) return <main className="p-6">Supabase not configured</main>
  const { data: { user } } = await s.auth.getUser()
  if (!user) redirect('/login')
  const { data: contacts } = await s
    .from('crm.contacts')
    .select('id,first_name,last_name,phone,email,city,source_id')
    .order('created_at', { ascending: false })

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold mb-4">Contactos</h1>
      <div className="overflow-auto">
        <table className="min-w-full border bg-white text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Nombre</th>
              <th className="p-2 border">Teléfono</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Ciudad</th>
              <th className="p-2 border">Fuente</th>
            </tr>
          </thead>
          <tbody>
            {contacts?.map(c => (
              <tr key={c.id}>
                <td className="p-2 border">{c.first_name} {c.last_name}</td>
                <td className="p-2 border">{c.phone}</td>
                <td className="p-2 border">{c.email}</td>
                <td className="p-2 border">{c.city}</td>
                <td className="p-2 border">{c.source_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}

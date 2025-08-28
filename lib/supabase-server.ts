import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const supabaseServer = () => {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: 'crm' },
      cookies: {
        // ✅ Solo lectura en Server Components (páginas)
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        // ❌ No escribir cookies desde páginas (Next no lo permite)
        set() {},
        remove() {},
      },
    }
  )
}

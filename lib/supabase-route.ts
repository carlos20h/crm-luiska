import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const supabaseRoute = () =>
  createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: 'crm' },
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value
        },
        // ✅ Aquí SÍ podemos escribir cookies
        set(name: string, value: string, options: CookieOptions) {
          cookies().set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookies().set({ name, value: '', ...options, maxAge: 0 })
        },
      },
    }
  )

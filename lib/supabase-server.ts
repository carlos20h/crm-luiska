import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const supabaseServer = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return cookies().get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        cookies().set({ name, value, ...options })
      },
      remove(name: string, options: CookieOptions) {
        cookies().set({ name, value: '', ...options, maxAge: 0 })
      },
    },
  })
}

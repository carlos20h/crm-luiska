import { createBrowserClient, type CookieOptions } from '@supabase/ssr'

export const supabaseBrowser = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createBrowserClient(url, key, {
    db: { schema: 'crm' },
    cookies: {
      get(name: string) {
        const match = document.cookie
          .split('; ')
          .find(row => row.startsWith(`${name}=`))
        return match?.split('=')[1] ?? null
      },
      set(name: string, value: string, options: CookieOptions) {
        const merged = { path: '/', ...options }
        const parts = [`${name}=${value}`, `path=${merged.path}`]
        if (merged.maxAge) parts.push(`max-age=${merged.maxAge}`)
        if (merged.expires) parts.push(`expires=${merged.expires.toUTCString()}`)
        if (merged.sameSite) parts.push(`samesite=${merged.sameSite}`)
        if (merged.secure) parts.push('secure')
        document.cookie = parts.join('; ')
      },
      remove(name: string, options: CookieOptions) {
        const merged = { path: '/', ...options }
        document.cookie = `${name}=; path=${merged.path}; max-age=0`
      },
    },
  })
}

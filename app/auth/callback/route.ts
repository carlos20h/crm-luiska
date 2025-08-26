import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function POST(req: Request) {
  const { event, session } = await req.json()
  // Create a server-side client with cookie access
  const s = supabaseServer()

  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    if (!session) return NextResponse.json({ ok: false }, { status: 400 })
    // Persist sb-access-token / sb-refresh-token cookies
    const { error } = await s.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    })
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  if (event === 'SIGNED_OUT') {
    await s.auth.signOut()
  }

  return NextResponse.json({ ok: true })
}

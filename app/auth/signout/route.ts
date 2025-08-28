import { NextResponse } from 'next/server'
import { supabaseRoute } from '@/lib/supabase-route'

export async function POST() {
  const s = supabaseRoute()
  await s.auth.signOut()
  return NextResponse.json({ ok: true })
}

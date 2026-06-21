'use client'

import { createClerkSupabaseClient } from './supabase'

export async function awardXp(session, clerkId, amount, reason = '') {
  if (!session || !clerkId || !amount) return
  const db = createClerkSupabaseClient(session)
  const { data: profile } = await db
    .from('user_profiles').select('xp').eq('clerk_id', clerkId).single()
  if (!profile) return
  const newXp = (profile.xp || 0) + amount
  await db.from('user_profiles').update({ xp: newXp }).eq('clerk_id', clerkId)
  if (reason) console.log(`XP +${amount} (${reason}) → total: ${newXp}`)
  return newXp
}

export async function awardToolDiscovery(session, clerkId, toolId) {
  if (!session || !clerkId || !toolId) return
  const key = `pharmlab_tool_${toolId}`
  if (typeof window !== 'undefined' && localStorage.getItem(key)) return
  if (typeof window !== 'undefined') localStorage.setItem(key, '1')
  await awardXp(session, clerkId, 10, `tool_discovery:${toolId}`)
}
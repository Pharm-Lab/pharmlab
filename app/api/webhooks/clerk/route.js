import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export async function POST(req) {
  // Service role client — bypasses RLS for webhook operations
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) {
    return new Response('Webhook secret not configured', { status: 500 })
  }

  const headerPayload = await headers()
  const svix_id        = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  const payload = await req.json()
  const body    = JSON.stringify(payload)

  let evt
  try {
    const wh = new Webhook(WEBHOOK_SECRET)
    evt = wh.verify(body, {
      'svix-id':        svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    })
  } catch (err) {
    console.error('Webhook verification failed:', err)
    return new Response('Invalid webhook signature', { status: 400 })
  }

  const { type, data } = evt

  if (type === 'user.deleted') {
    const { id: clerkId } = data
    if (clerkId) {
      const { error } = await adminSupabase
        .from('user_profiles')
        .delete()
        .eq('clerk_id', clerkId)
      if (error) console.error('Failed to delete user profile:', error)
      else console.log(`Deleted profile for clerk_id: ${clerkId}`)
    }
  }

  if (type === 'user.updated') {
    const { id: clerkId, image_url } = data
    if (clerkId && image_url) {
      await adminSupabase
        .from('user_profiles')
        .update({ avatar_url: image_url })
        .eq('clerk_id', clerkId)
    }
  }

  return new Response('OK', { status: 200 })
}
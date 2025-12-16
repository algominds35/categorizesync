import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    // Get the webhook secret
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

    if (!WEBHOOK_SECRET) {
      console.error('[error] Missing CLERK_WEBHOOK_SECRET')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    // Get the headers
    const headerPayload = headers()
    const svix_id = headerPayload.get('svix-id')
    const svix_timestamp = headerPayload.get('svix-timestamp')
    const svix_signature = headerPayload.get('svix-signature')

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return NextResponse.json(
        { error: 'Missing svix headers' },
        { status: 400 }
      )
    }

    // Get the body
    const payload = await request.json()
    const body = JSON.stringify(payload)

    // Create a new Svix instance with your webhook secret
    const wh = new Webhook(WEBHOOK_SECRET)

    let evt: any

    // Verify the webhook
    try {
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      })
    } catch (err) {
      console.error('[error] Error verifying webhook:', err)
      return NextResponse.json(
        { error: 'Webhook verification failed' },
        { status: 400 }
      )
    }

    // Handle the webhook
    const eventType = evt.type

    if (eventType === 'user.created') {
      const { id, email_addresses, first_name, last_name } = evt.data

      const email = email_addresses[0]?.email_address

      if (!email) {
        console.error('[error] No email in user.created webhook')
        return NextResponse.json(
          { error: 'No email provided' },
          { status: 400 }
        )
      }

      // Create user in database
      const user = await db.user.create({
        data: {
          clerkId: id,
          email,
          name: `${first_name || ''} ${last_name || ''}`.trim() || null,
        }
      })

      console.log('[info] User created:', user.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[error] Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

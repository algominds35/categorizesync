import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { syncTransactionsForClient } from '@/lib/services/quickbooks-service'

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { clientId } = await request.json()

    // Verify client belongs to user
    const client = await db.client.findFirst({
      where: {
        id: clientId,
        user: { clerkId: userId }
      }
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Trigger sync (in production, this would use BullMQ queue)
    const result = await syncTransactionsForClient(client.id)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Transaction sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync transactions' },
      { status: 500 }
    )
  }
}


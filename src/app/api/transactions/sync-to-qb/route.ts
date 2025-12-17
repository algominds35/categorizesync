import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { syncCategorizationToQB } from '@/lib/services/quickbooks-service'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { clientId } = body

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID required' }, { status: 400 })
    }

    // Get user
    const user = await db.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get client with approved transactions
    const client = await db.client.findFirst({
      where: {
        id: clientId,
        userId: user.id,
      },
      include: {
        transactions: {
          where: {
            status: 'APPROVED',
          },
        },
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    if (client.transactions.length === 0) {
      return NextResponse.json({ 
        message: 'No approved transactions to sync',
        synced: 0,
      })
    }

    // Sync each approved transaction
    let syncedCount = 0
    for (const transaction of client.transactions) {
      try {
        await syncCategorizationToQB(transaction.id)
        syncedCount++
      } catch (error) {
        console.error(`Failed to sync transaction ${transaction.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      synced: syncedCount,
      total: client.transactions.length,
    })
  } catch (error) {
    console.error('Error syncing to QuickBooks:', error)
    return NextResponse.json(
      { error: 'Failed to sync to QuickBooks' },
      { status: 500 }
    )
  }
}

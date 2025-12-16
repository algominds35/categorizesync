import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { syncCategorizationToQB } from '@/lib/services/quickbooks-service'

export async function POST(request: Request) {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { clientId } = await request.json()

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID required' },
        { status: 400 }
      )
    }

    // Get database user
    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id }
    })

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get client with approved transactions
    const client = await db.client.findFirst({
      where: {
        id: clientId,
        userId: dbUser.id
      },
      include: {
        transactions: {
          where: {
            status: 'APPROVED',
            syncedToQB: false
          }
        }
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found or unauthorized' },
        { status: 404 }
      )
    }

    if (client.transactions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No approved transactions to sync',
        synced: 0
      })
    }

    let syncedCount = 0
    const errors: string[] = []

    // Sync each approved transaction
    for (const transaction of client.transactions) {
      try {
        if (!transaction.finalAccountId || !transaction.finalAccountName) {
          errors.push(`Transaction ${transaction.id}: Missing final account`)
          continue
        }

        await syncCategorizationToQB(transaction.id)
        syncedCount++
      } catch (error) {
        console.error(`[error] Failed to sync transaction ${transaction.id}:`, error)
        errors.push(`Transaction ${transaction.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      synced: syncedCount,
      total: client.transactions.length,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('[error] Error syncing to QuickBooks:', error)
    return NextResponse.json(
      { error: 'Failed to sync to QuickBooks' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { createQBServiceForClient } from '@/lib/services/quickbooks-service'

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find user in database
    const user = await db.user.findUnique({
      where: { clerkId: clerkUserId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get request body
    const body = await request.json()
    const { clientId, transactionIds } = body

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    // Verify user owns this client
    const client = await db.client.findFirst({
      where: {
        id: clientId,
        userId: user.id,
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found or unauthorized' },
        { status: 404 }
      )
    }

    // Initialize QuickBooks service
    const qbService = await createQBServiceForClient(clientId)

    // Get approved transactions to sync
    const transactions = transactionIds
      ? await db.transaction.findMany({
          where: {
            id: { in: transactionIds },
            clientId,
            status: 'APPROVED',
          },
        })
      : await db.transaction.findMany({
          where: {
            clientId,
            status: 'APPROVED',
            syncedToQb: false,
          },
        })

    console.log(`Found ${transactions.length} approved transactions to sync`)

    let synced = 0
    let errors = 0
    const errorDetails: any[] = []

    for (const transaction of transactions) {
      try {
        // Update transaction in QuickBooks
        await qbService.updateTransactionCategory(
          transaction.qbId,
          transaction.qbType,
          transaction.finalAccountId!,
          transaction.finalClassId || undefined
        )

        // Mark as synced
        await db.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'SYNCED',
            syncedToQb: true,
            syncedAt: new Date(),
            syncError: null,
          },
        })

        synced++
        console.log(`✓ Synced transaction ${transaction.qbId} to QuickBooks`)
      } catch (error: any) {
        console.error(`Error syncing transaction ${transaction.id}:`, error)
        
        // Mark error
        await db.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'ERROR',
            syncError: error.message || 'Unknown error',
          },
        })

        errors++
        errorDetails.push({
          transactionId: transaction.id,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      synced,
      errors,
      errorDetails,
      message: `Successfully synced ${synced} transactions to QuickBooks${errors > 0 ? `, ${errors} errors` : ''}`,
    })
  } catch (error: any) {
    console.error('Error syncing to QuickBooks:', error)
    return NextResponse.json(
      {
        error: 'Failed to sync to QuickBooks',
        details: error.message,
      },
      { status: 500 }
    )
  }
}






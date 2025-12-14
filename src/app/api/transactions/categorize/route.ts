import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { categorizeTransaction } from '@/lib/services/ai-categorization-service'

/**
 * POST /api/transactions/categorize
 * Categorize transactions using AI
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
        userId: userId,
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found or unauthorized' },
        { status: 404 }
      )
    }

    // If specific transaction IDs provided, categorize those
    // Otherwise, categorize all pending transactions
    let transactions
    if (transactionIds && Array.isArray(transactionIds)) {
      transactions = await db.transaction.findMany({
        where: {
          id: { in: transactionIds },
          clientId,
          status: 'PENDING',
        },
      })
    } else {
      transactions = await db.transaction.findMany({
        where: {
          clientId,
          status: 'PENDING',
          aiAccountId: null, // Not yet categorized by AI
        },
        take: 100, // Limit to 100 at a time to avoid timeouts
      })
    }

    if (transactions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No transactions to categorize',
        categorized: 0,
      })
    }

    // Categorize each transaction
    const results = []
    const errors = []

    for (const transaction of transactions) {
      try {
        const result = await categorizeTransaction(transaction.id)
        results.push({
          transactionId: transaction.id,
          success: true,
          ...result,
        })
      } catch (error: any) {
        console.error(`Error categorizing transaction ${transaction.id}:`, error)
        errors.push({
          transactionId: transaction.id,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Categorized ${results.length} transactions`,
      categorized: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error('Error in categorize endpoint:', error)
    return NextResponse.json(
      {
        error: 'Failed to categorize transactions',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/transactions/categorize?clientId=xxx
 * Get categorization status for a client
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

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
        userId: userId,
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found or unauthorized' },
        { status: 404 }
      )
    }

    // Get transaction counts by status
    const stats = await db.transaction.groupBy({
      by: ['status'],
      where: {
        clientId,
      },
      _count: {
        id: true,
      },
    })

    // Get uncategorized count
    const uncategorized = await db.transaction.count({
      where: {
        clientId,
        aiAccountId: null,
        status: 'PENDING',
      },
    })

    const statusMap = stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.id
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      clientId,
      uncategorized,
      pending: statusMap.PENDING || 0,
      approved: statusMap.APPROVED || 0,
      edited: statusMap.EDITED || 0,
      synced: statusMap.SYNCED || 0,
      error: statusMap.ERROR || 0,
      total: stats.reduce((sum, s) => sum + s._count.id, 0),
    })
  } catch (error: any) {
    console.error('Error getting categorization status:', error)
    return NextResponse.json(
      {
        error: 'Failed to get status',
        details: error.message,
      },
      { status: 500 }
    )
  }
}



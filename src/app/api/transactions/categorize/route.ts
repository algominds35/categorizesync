import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { categorizeTransaction } from '@/lib/services/ai-categorization-service'

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

    // Get client with pending transactions
    const client = await db.client.findFirst({
      where: {
        id: clientId,
        userId: dbUser.id
      },
      include: {
        transactions: {
          where: {
            status: 'PENDING',
            aiSuggestedAccountId: null
          },
          take: 50 // Process in batches
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
        message: 'No pending transactions to categorize',
        categorized: 0
      })
    }

    let categorizedCount = 0

    // Categorize each transaction
    for (const transaction of client.transactions) {
      try {
        await categorizeTransaction(transaction.id)
        categorizedCount++
      } catch (error) {
        console.error(`[error] Failed to categorize transaction ${transaction.id}:`, error)
        // Continue with next transaction
      }
    }

    return NextResponse.json({
      success: true,
      categorized: categorizedCount,
      total: client.transactions.length
    })
  } catch (error) {
    console.error('[error] Error categorizing transactions:', error)
    return NextResponse.json(
      { error: 'Failed to categorize transactions' },
      { status: 500 }
    )
  }
}

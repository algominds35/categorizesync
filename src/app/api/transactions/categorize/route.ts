import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { categorizeTransaction } from '@/lib/services/ai-categorization-service'

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

    // Verify client belongs to user
    const client = await db.client.findFirst({
      where: {
        id: clientId,
        userId: user.id,
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Get pending transactions that don't have AI suggestions yet
    const transactions = await db.transaction.findMany({
      where: {
        clientId,
        status: 'PENDING',
        aiAccountId: null, // Only categorize if not already done
      },
      take: 50, // Process in batches
    })

    if (transactions.length === 0) {
      return NextResponse.json({ 
        message: 'No pending transactions to categorize',
        categorized: 0,
      })
    }

    // Get available accounts and classes for this client
    const accounts = await db.account.findMany({
      where: { clientId },
    })

    const classes = await db.class.findMany({
      where: { clientId },
    })

    // Categorize each transaction
    let categorizedCount = 0
    for (const transaction of transactions) {
      try {
        const result = await categorizeTransaction(
          clientId,
          transaction.description,
          transaction.vendor || '',
          transaction.amount,
          accounts,
          classes
        )

        await db.transaction.update({
          where: { id: transaction.id },
          data: {
            aiAccountId: result.accountId,
            aiAccountName: result.accountName,
            aiClassName: result.className,
            aiConfidenceScore: result.confidence,
            aiReasoning: result.reasoning,
          },
        })

        categorizedCount++
      } catch (error) {
        console.error(`Failed to categorize transaction ${transaction.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      categorized: categorizedCount,
      total: transactions.length,
    })
  } catch (error) {
    console.error('Error categorizing transactions:', error)
    return NextResponse.json(
      { error: 'Failed to categorize transactions' },
      { status: 500 }
    )
  }
}

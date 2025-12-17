import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { createLearningExample } from '@/lib/services/ai-categorization-service'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { transactionId, accountId, accountName, className } = body

    if (!transactionId || !accountId) {
      return NextResponse.json(
        { error: 'Transaction ID and Account ID required' },
        { status: 400 }
      )
    }

    // Update transaction status and final categorization
    const transaction = await db.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'APPROVED',
        finalAccountId: accountId,
        finalAccountName: accountName,
        finalClassName: className || null,
      },
      include: {
        client: true,
      },
    })

    // Create learning example for AI improvement (non-blocking)
    try {
      await createLearningExample(
        transaction.clientId,
        transaction.description,
        transaction.vendor || '',
        accountId,
        accountName
      )
      console.log('✓ Learning example created for transaction', transactionId)
    } catch (learningError) {
      console.error('Failed to create learning example (non-critical):', learningError)
      // Don't fail the approval if learning fails
    }

    return NextResponse.json({ 
      success: true,
      transaction,
    })
  } catch (error) {
    console.error('Error approving transaction:', error)
    return NextResponse.json(
      { error: 'Failed to approve transaction' },
      { status: 500 }
    )
  }
}

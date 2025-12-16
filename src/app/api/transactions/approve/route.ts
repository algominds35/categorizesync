import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { createLearningExample } from '@/lib/services/ai-categorization-service'

export async function POST(request: Request) {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { transactionId, accountId, accountName } = await request.json()

    if (!transactionId || !accountId || !accountName) {
      return NextResponse.json(
        { error: 'Transaction ID, account ID, and account name required' },
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

    // Get transaction with client to verify ownership
    const transaction = await db.transaction.findFirst({
      where: {
        id: transactionId,
        client: {
          userId: dbUser.id
        }
      },
      include: {
        client: true
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found or unauthorized' },
        { status: 404 }
      )
    }

    // Update transaction status
    const updatedTransaction = await db.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'APPROVED',
        finalAccountId: accountId,
        finalAccountName: accountName,
        updatedAt: new Date()
      }
    })

    // Create learning example in Pinecone
    try {
      await createLearningExample(transactionId)
      console.log('[info] Learning example created for transaction:', transactionId)
    } catch (learningError) {
      console.error('[error] Failed to create learning example:', learningError)
      // Don't fail the approval if learning fails
    }

    return NextResponse.json({
      success: true,
      transaction: updatedTransaction
    })
  } catch (error) {
    console.error('[error] Error approving transaction:', error)
    return NextResponse.json(
      { error: 'Failed to approve transaction' },
      { status: 500 }
    )
  }
}

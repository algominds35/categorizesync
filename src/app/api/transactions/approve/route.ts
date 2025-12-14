import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { createLearningExample } from '@/lib/services/ai-categorization-service'

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
    const { transactionId, approved, accountId, classId } = body

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      )
    }

    // Get transaction and verify ownership
    const transaction = await db.transaction.findFirst({
      where: {
        id: transactionId,
      },
      include: {
        client: true,
      },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    if (transaction.client.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    if (approved) {
      // Approve transaction - store the AI categorization as the final categorization
      const updatedTransaction = await db.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          finalAccountId: transaction.aiAccountId,
          finalAccountName: transaction.aiAccountName,
          finalClassId: transaction.aiClassId || null,
          finalClassName: transaction.aiClassName || null,
        },
      })

      // Store learning example in Pinecone for future AI improvements
      try {
        await createLearningExample(transactionId)
        console.log(`✓ Learning example created for transaction ${transactionId}`)
      } catch (error) {
        console.error('Error creating learning example:', error)
        // Non-critical - continue even if Pinecone fails
      }

      return NextResponse.json({
        success: true,
        message: 'Transaction approved and learning example stored',
        transaction: updatedTransaction,
      })
    } else {
      // Reject transaction (reset to pending)
      await db.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'PENDING',
          aiAccountId: null,
          aiAccountName: null,
          aiClassId: null,
          aiClassName: null,
          aiConfidenceScore: null,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Transaction rejected',
      })
    }
  } catch (error: any) {
    console.error('Error approving transaction:', error)
    return NextResponse.json(
      {
        error: 'Failed to process transaction',
        details: error.message,
      },
      { status: 500 }
    )
  }
}


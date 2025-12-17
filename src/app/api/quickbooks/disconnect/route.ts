import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

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

    // Get user from database
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
      return NextResponse.json({ error: 'Client not found or unauthorized' }, { status: 404 })
    }

    // Delete client and all related data (cascade will handle transactions and learning examples)
    await db.client.delete({
      where: { id: clientId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error disconnecting client:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect client' },
      { status: 500 }
    )
  }
}

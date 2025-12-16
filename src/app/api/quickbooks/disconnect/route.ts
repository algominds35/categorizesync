import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

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

    // Verify client belongs to user and delete
    const client = await db.client.findFirst({
      where: {
        id: clientId,
        userId: dbUser.id
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found or unauthorized' },
        { status: 404 }
      )
    }

    // Delete client (cascade will delete transactions and learning examples)
    await db.client.delete({
      where: { id: clientId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[error] Error disconnecting client:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect client' },
      { status: 500 }
    )
  }
}

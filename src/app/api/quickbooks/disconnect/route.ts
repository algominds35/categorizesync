import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { clientId } = await request.json()

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    // Find the database user
    const user = await db.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify the client belongs to this user
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

    // Delete all associated data (transactions, learning examples, etc.)
    // Prisma will handle cascading deletes based on schema
    await db.client.delete({
      where: { id: clientId },
    })

    console.log(`Client ${clientId} disconnected successfully by user ${userId}`)

    return NextResponse.json({
      success: true,
      message: 'Client disconnected successfully',
    })
  } catch (error) {
    console.error('Error disconnecting client:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect client' },
      { status: 500 }
    )
  }
}











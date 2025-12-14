import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { TransactionReviewList } from '@/components/transactions/transaction-review-list'

interface ReviewPageProps {
  params: {
    clientId: string
  }
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const user = await currentUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  // Get user from database
  const dbUser = await db.user.findUnique({
    where: { clerkId: user.id },
  })

  if (!dbUser) {
    redirect('/dashboard')
  }

  // Get client and verify ownership
  const client = await db.client.findFirst({
    where: {
      id: params.clientId,
      userId: dbUser.id,
    },
  })

  if (!client) {
    redirect('/dashboard')
  }

  // Get all transactions for this client
  const transactions = await db.transaction.findMany({
    where: {
      clientId: params.clientId,
    },
    orderBy: {
      date: 'desc',
    },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Review Transactions</h1>
              <p className="text-gray-600">{client.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>All Transactions ({transactions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionReviewList transactions={transactions} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { TransactionReviewList } from '@/components/transactions/transaction-review-list'
import { ClientActions } from '@/components/clients/client-actions'

export default async function ReviewPage({
  params,
}: {
  params: { clientId: string }
}) {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  // Get database user
  const dbUser = await db.user.findUnique({
    where: { clerkId: user.id }
  })

  if (!dbUser) {
    redirect('/sign-in')
  }

  // Get client with transactions
  const client = await db.client.findFirst({
    where: {
      id: params.clientId,
      userId: dbUser.id
    },
    include: {
      transactions: {
        where: {
          status: 'PENDING',
        },
        orderBy: {
          date: 'desc'
        }
      }
    }
  })

  if (!client) {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Review Transactions</h1>
        <p className="text-muted-foreground mt-2">
          {client.name} - {client.transactions.length} pending transaction(s)
        </p>
      </div>

      <ClientActions clientId={params.clientId} />

      {client.transactions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No pending transactions to review.</p>
        </div>
      ) : (
        <TransactionReviewList 
          transactions={client.transactions}
          clientId={params.clientId}
        />
      )}
    </div>
  )
}

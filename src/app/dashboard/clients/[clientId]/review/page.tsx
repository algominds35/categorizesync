import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

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
              <p className="text-gray-600">{client.qbCompanyName}</p>
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
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No transactions found. Click &quot;Sync&quot; to fetch transactions from QuickBooks.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor/Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">AI Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {transactions.map((txn) => (
                      <tr key={txn.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {new Date(txn.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {txn.qbType}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {txn.vendor || txn.customer || '-'}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {txn.description || txn.memo || '-'}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900 text-right font-medium">
                          ${txn.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {txn.aiAccountName ? (
                            <div>
                              <div className="font-medium">{txn.aiAccountName}</div>
                              {txn.aiClassName && (
                                <div className="text-xs text-gray-500">{txn.aiClassName}</div>
                              )}
                              {txn.aiConfidence && (
                                <div className="text-xs text-gray-500">
                                  {Math.round(txn.aiConfidence * 100)}% confidence
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">Not categorized</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <StatusBadge status={txn.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
    APPROVED: { label: 'Approved', className: 'bg-green-100 text-green-800' },
    EDITED: { label: 'Edited', className: 'bg-blue-100 text-blue-800' },
    SYNCED: { label: 'Synced', className: 'bg-purple-100 text-purple-800' },
    ERROR: { label: 'Error', className: 'bg-red-100 text-red-800' },
  }

  const variant = variants[status] || { label: status, className: 'bg-gray-100 text-gray-800' }

  return (
    <Badge className={variant.className}>
      {variant.label}
    </Badge>
  )
}


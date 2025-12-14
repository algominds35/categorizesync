'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

interface Transaction {
  id: string
  qbId: string
  qbType: string
  date: Date
  amount: number
  description: string | null
  vendor: string | null
  customer: string | null
  memo: string | null
  status: string
  aiAccountId: string | null
  aiAccountName: string | null
  aiClassId: string | null
  aiClassName: string | null
  aiConfidenceScore: number | null
}

interface TransactionReviewListProps {
  transactions: Transaction[]
}

export function TransactionReviewList({ transactions }: TransactionReviewListProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const handleApprove = async (transaction: Transaction) => {
    setLoading(transaction.id)
    try {
      const response = await fetch('/api/transactions/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: transaction.id,
          approved: true,
          accountId: transaction.aiAccountId,
          classId: transaction.aiClassId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to approve transaction')
      }

      toast({
        title: 'Success',
        description: 'Transaction approved',
      })

      router.refresh()
    } catch (error) {
      console.error('Error approving transaction:', error)
      toast({
        title: 'Error',
        description: 'Failed to approve transaction',
        variant: 'destructive',
      })
    } finally {
      setLoading(null)
    }
  }

  const handleReject = async (transaction: Transaction) => {
    setLoading(transaction.id)
    try {
      const response = await fetch('/api/transactions/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: transaction.id,
          approved: false,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to reject transaction')
      }

      toast({
        title: 'Success',
        description: 'Transaction rejected',
      })

      router.refresh()
    } catch (error) {
      console.error('Error rejecting transaction:', error)
      toast({
        title: 'Error',
        description: 'Failed to reject transaction',
        variant: 'destructive',
      })
    } finally {
      setLoading(null)
    }
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No transactions found. Click &quot;Sync&quot; to fetch transactions from QuickBooks.
      </div>
    )
  }

  return (
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
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
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
                    {txn.aiConfidenceScore && (
                      <div className="text-xs text-gray-500">
                        {Math.round(txn.aiConfidenceScore * 100)}% confidence
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
              <td className="px-4 py-4 text-sm">
                {txn.status === 'PENDING' && txn.aiAccountName ? (
                  <div className="flex items-center gap-2 justify-center">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleApprove(txn)}
                      disabled={loading === txn.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(txn)}
                      disabled={loading === txn.id}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                ) : txn.status === 'APPROVED' ? (
                  <div className="text-center text-sm text-green-600">
                    ✓ Approved
                  </div>
                ) : (
                  <div className="text-center text-sm text-gray-400">
                    -
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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


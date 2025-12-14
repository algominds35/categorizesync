/**
 * Transaction Types for the Application
 */

export type TransactionStatus = 'PENDING' | 'APPROVED' | 'EDITED' | 'SYNCED' | 'ERROR'

export interface Transaction {
  id: string
  clientId: string
  createdAt: Date
  updatedAt: Date

  // QuickBooks Data
  qbId: string
  qbType: string
  date: Date
  amount: number
  description?: string | null
  vendor?: string | null
  customer?: string | null
  memo?: string | null

  // Original QuickBooks categorization
  originalAccountId?: string | null
  originalAccountName?: string | null
  originalClassId?: string | null
  originalClassName?: string | null

  // AI Categorization
  aiAccountId?: string | null
  aiAccountName?: string | null
  aiClassId?: string | null
  aiClassName?: string | null
  aiConfidenceScore?: number | null
  aiReasoningNotes?: string | null

  // Review Status
  status: TransactionStatus
  reviewedAt?: Date | null

  // Final Categorization
  finalAccountId?: string | null
  finalAccountName?: string | null
  finalClassId?: string | null
  finalClassName?: string | null

  // Sync
  syncedToQb: boolean
  syncedAt?: Date | null
  syncError?: string | null
}

export interface TransactionWithClient extends Transaction {
  client: {
    id: string
    name: string
    qbRealmId: string
  }
}

export interface CategorizationSuggestion {
  accountId: string
  accountName: string
  classId?: string
  className?: string
  confidenceScore: number
  reasoning: string
}

export interface TransactionBatch {
  transactions: Transaction[]
  total: number
  pending: number
  approved: number
  synced: number
  errors: number
}

export interface SyncResult {
  success: boolean
  transactionsFetched: number
  transactionsStored: number
  transactionsSkipped: number
  message: string
  errors?: string[]
}






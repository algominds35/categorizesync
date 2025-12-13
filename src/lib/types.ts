// Shared TypeScript types and interfaces

export interface QBTransaction {
  id: string
  qbId: string
  date: Date
  amount: number
  description?: string
  vendor?: string
  customer?: string
  memo?: string
  status: TransactionStatus
  aiAccountId?: string
  aiAccountName?: string
  aiConfidenceScore?: number
  aiReasoningNotes?: string
  finalAccountId?: string
  finalAccountName?: string
}

export type TransactionStatus = 'PENDING' | 'APPROVED' | 'EDITED' | 'SYNCED' | 'ERROR'

export interface AICategorizationResult {
  accountId: string
  accountName: string
  classId?: string
  className?: string
  confidence: number
  reasoning: string
}

export interface QBAccount {
  id: string
  qbId: string
  name: string
  fullyQualifiedName?: string
  accountType: string
  accountSubType?: string
  active: boolean
}

export interface QBClass {
  id: string
  qbId: string
  name: string
  fullyQualifiedName?: string
  active: boolean
}

export interface ClientWithStats {
  id: string
  name: string
  qbRealmId: string
  isActive: boolean
  lastSyncAt?: Date
  pendingTransactions: number
  totalTransactions: number
  accuracy?: number
}

export interface DashboardStats {
  totalClients: number
  pendingTransactions: number
  timeSavedHours: number
  overallAccuracy: number
}

export interface KeyboardShortcut {
  key: string
  description: string
  action: () => void
}

export interface LearningExample {
  id: string
  description: string
  vendor?: string
  correctAccountId: string
  correctAccountName: string
  wasCorrect: boolean
}

export interface UsageMetrics {
  transactionsProcessed: number
  accuracyRate: number
  timeSaved: number
  costSavings: number
}


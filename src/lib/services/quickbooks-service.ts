import QuickBooks from 'node-quickbooks'
import { db } from '@/lib/db'
import { QBTransaction, QBAccount, QBClass } from '@/types/quickbooks'

export class QuickBooksService {
  private qb: any

  constructor(
    accessToken: string,
    refreshToken: string,
    realmId: string,
    environment: string = 'production'
  ) {
    // Initialize QuickBooks client
    const clientId = process.env.QB_CLIENT_ID!
    const clientSecret = process.env.QB_CLIENT_SECRET!
    const useSandbox = environment === 'sandbox'

    // For OAuth 2.0, use simplified constructor
    this.qb = new QuickBooks(
      clientId,
      clientSecret,
      accessToken,
      false, // no token secret for OAuth 2.0
      realmId,
      useSandbox,
      false, // debug
      65, // minor version (number, not string)
      '2.0', // OAuth version
      refreshToken
    )
  }

  /**
   * Fetch uncategorized transactions (Purchases, Expenses, Journal Entries)
   */
  async fetchUncategorizedTransactions(
    startDate?: Date,
    endDate?: Date
  ): Promise<QBTransaction[]> {
    const transactions: QBTransaction[] = []

    // Default to last 90 days if no date range provided
    const start = startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    const end = endDate || new Date()

    const startDateStr = start.toISOString().split('T')[0]
    const endDateStr = end.toISOString().split('T')[0]

    try {
      // Fetch Purchases
      const purchases = await this.queryTransactions(
        'Purchase',
        startDateStr,
        endDateStr
      )
      transactions.push(...purchases)

      // Fetch Expenses
      const expenses = await this.queryTransactions(
        'Expense',
        startDateStr,
        endDateStr
      )
      transactions.push(...expenses)

      // Fetch Journal Entries
      const journalEntries = await this.queryTransactions(
        'JournalEntry',
        startDateStr,
        endDateStr
      )
      transactions.push(...journalEntries)

      return transactions
    } catch (error) {
      console.error('Error fetching QB transactions:', error)
      throw error
    }
  }

  /**
   * Query transactions by type
   */
  private async queryTransactions(
    type: string,
    startDate: string,
    endDate: string
  ): Promise<QBTransaction[]> {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM ${type} WHERE TxnDate >= '${startDate}' AND TxnDate <= '${endDate}' MAXRESULTS 1000`

      // Use the query method (not reportQuery)
      this.qb.query(query, (err: any, data: any) => {
        if (err) {
          console.error(`Error querying ${type}:`, err)
          return resolve([]) // Return empty array on error, don't fail entire sync
        }

        const entities = data?.QueryResponse?.[type] || []
        resolve(Array.isArray(entities) ? entities : [entities].filter(Boolean))
      })
    })
  }

  /**
   * Fetch all accounts (for categorization)
   */
  async fetchAccounts(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.qb.findAccounts(
        { fetchAll: true },
        (err: any, accounts: any) => {
          if (err) {
            console.error('Error fetching accounts:', err)
            return reject(err)
          }

          const accountList = accounts?.QueryResponse?.Account || []
          resolve(Array.isArray(accountList) ? accountList : [accountList])
        }
      )
    })
  }

  /**
   * Fetch all classes (for categorization)
   */
  async fetchClasses(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.qb.findClasses(
        { fetchAll: true },
        (err: any, classes: any) => {
          if (err) {
            console.error('Error fetching classes:', err)
            return resolve([]) // Classes are optional
          }

          const classList = classes?.QueryResponse?.Class || []
          resolve(Array.isArray(classList) ? classList : [classList])
        }
      )
    })
  }

  /**
   * Update transaction category in QuickBooks
   */
  async updateTransactionCategory(
    transactionId: string,
    accountId: string,
    classId?: string
  ): Promise<boolean> {
    // TODO: Implement update logic
    // This requires fetching the transaction, modifying it, and updating
    return Promise.resolve(true)
  }

  /**
   * Refresh access token if expired
   */
  async refreshAccessToken(): Promise<{
    accessToken: string
    refreshToken: string
    expiresIn: number
  }> {
    return new Promise((resolve, reject) => {
      this.qb.refreshAccessToken((err: any, data: any) => {
        if (err) {
          console.error('Error refreshing token:', err)
          return reject(err)
        }

        resolve({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresIn: data.expires_in,
        })
      })
    })
  }
}

/**
 * Initialize QB service for a specific client
 */
export async function createQBServiceForClient(clientId: string) {
  const client = await db.client.findUnique({
    where: { id: clientId },
  })

  if (!client) {
    throw new Error('Client not found')
  }

  // Check if token is expired
  const now = new Date()
  const tokenExpiry = new Date(client.qbTokenExpiry)

  if (now >= tokenExpiry) {
    // Token expired, refresh it
    const qbService = new QuickBooksService(
      client.qbAccessToken,
      client.qbRefreshToken,
      client.qbRealmId,
      client.qbEnvironment
    )

    const newTokens = await qbService.refreshAccessToken()

    // Update tokens in database
    await db.client.update({
      where: { id: clientId },
      data: {
        qbAccessToken: newTokens.accessToken,
        qbRefreshToken: newTokens.refreshToken,
        qbTokenExpiry: new Date(Date.now() + newTokens.expiresIn * 1000),
      },
    })

    return new QuickBooksService(
      newTokens.accessToken,
      newTokens.refreshToken,
      client.qbRealmId,
      client.qbEnvironment
    )
  }

  return new QuickBooksService(
    client.qbAccessToken,
    client.qbRefreshToken,
    client.qbRealmId,
    client.qbEnvironment
  )
}

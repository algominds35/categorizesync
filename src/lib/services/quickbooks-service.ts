import QuickBooks from 'node-quickbooks'
import { db } from '@/lib/db'
import { QBTransaction, QBAccount, QBClass } from '@/types/quickbooks'

export class QuickBooksService {
  private qb: any
  private accessToken: string
  private realmId: string
  private baseUrl: string

  constructor(
    accessToken: string,
    refreshToken: string,
    realmId: string,
    environment: string = 'production'
  ) {
    // Store for direct API calls
    this.accessToken = accessToken
    this.realmId = realmId
    this.baseUrl = environment === 'sandbox' 
      ? 'https://sandbox-quickbooks.api.intuit.com'
      : 'https://quickbooks.api.intuit.com'

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
   * Make direct API request to QuickBooks
   */
  private async makeApiRequest(query: string): Promise<any> {
    const url = `${this.baseUrl}/v3/company/${this.realmId}/query?query=${encodeURIComponent(query)}&minorversion=65`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('QB API Error:', error)
      throw new Error(`QuickBooks API error: ${response.status}`)
    }

    return response.json()
  }

  /**
   * Fetch uncategorized transactions (Purchases, Expenses, Journal Entries)
   */
  async fetchUncategorizedTransactions(
    startDate?: Date,
    endDate?: Date
  ): Promise<QBTransaction[]> {
    const transactions: QBTransaction[] = []

    try {
      // Fetch Purchases
      const purchaseQuery = 'SELECT * FROM Purchase MAXRESULTS 100'
      const purchaseData = await this.makeApiRequest(purchaseQuery)
      const purchases = purchaseData?.QueryResponse?.Purchase || []
      transactions.push(...(Array.isArray(purchases) ? purchases : [purchases].filter(Boolean)))

      console.log(`Fetched ${purchases.length} purchases`)

      // Fetch Expenses  
      const expenseQuery = 'SELECT * FROM Expense MAXRESULTS 100'
      const expenseData = await this.makeApiRequest(expenseQuery)
      const expenses = expenseData?.QueryResponse?.Expense || []
      transactions.push(...(Array.isArray(expenses) ? expenses : [expenses].filter(Boolean)))

      console.log(`Fetched ${expenses.length} expenses`)

      return transactions
    } catch (error) {
      console.error('Error fetching QB transactions:', error)
      throw error
    }
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

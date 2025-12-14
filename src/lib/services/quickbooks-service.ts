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
    
    console.log('=== QuickBooks API Request ===')
    console.log('URL:', url)
    console.log('RealmId:', this.realmId)
    console.log('Token (first 20 chars):', this.accessToken?.substring(0, 20) + '...')
    console.log('Base URL:', this.baseUrl)
    console.log('Query:', query)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })

    console.log('Response status:', response.status)

    if (!response.ok) {
      const error = await response.text()
      console.error('QB API Error:', error)
      console.error('Full response status:', response.status, response.statusText)
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
      // Fetch Purchases (checks, credit card charges, cash purchases)
      const purchaseQuery = 'SELECT * FROM Purchase MAXRESULTS 100'
      const purchaseData = await this.makeApiRequest(purchaseQuery)
      const purchases = purchaseData?.QueryResponse?.Purchase || []
      transactions.push(...(Array.isArray(purchases) ? purchases : [purchases].filter(Boolean)))

      console.log(`Fetched ${purchases.length} purchases`)

      // Fetch Bills  
      const billQuery = 'SELECT * FROM Bill MAXRESULTS 100'
      const billData = await this.makeApiRequest(billQuery)
      const bills = billData?.QueryResponse?.Bill || []
      transactions.push(...(Array.isArray(bills) ? bills : [bills].filter(Boolean)))

      console.log(`Fetched ${bills.length} bills`)

      // Fetch Journal Entries
      const journalQuery = 'SELECT * FROM JournalEntry MAXRESULTS 100'
      const journalData = await this.makeApiRequest(journalQuery)
      const journals = journalData?.QueryResponse?.JournalEntry || []
      transactions.push(...(Array.isArray(journals) ? journals : [journals].filter(Boolean)))

      console.log(`Fetched ${journals.length} journal entries`)

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

  console.log('=== Creating QB Service ===')
  console.log('Client ID:', clientId)
  console.log('RealmId:', client.qbRealmId)
  console.log('Environment:', client.qbEnvironment)
  console.log('Token expiry:', client.qbTokenExpiry)
  console.log('Token expired?:', new Date() >= new Date(client.qbTokenExpiry))

  // Check if token is expired
  const now = new Date()
  const tokenExpiry = new Date(client.qbTokenExpiry)

  if (now >= tokenExpiry) {
    console.log('Token expired, refreshing...')
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

    console.log('Token refreshed successfully')

    return new QuickBooksService(
      newTokens.accessToken,
      newTokens.refreshToken,
      client.qbRealmId,
      client.qbEnvironment
    )
  }

  console.log('Using existing token')

  return new QuickBooksService(
    client.qbAccessToken,
    client.qbRefreshToken,
    client.qbRealmId,
    client.qbEnvironment
  )
}

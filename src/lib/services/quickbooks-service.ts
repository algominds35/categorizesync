import QuickBooks from 'node-quickbooks'
import { db } from '@/lib/db'

const QB_CLIENT_ID = process.env.QB_CLIENT_ID!
const QB_CLIENT_SECRET = process.env.QB_CLIENT_SECRET!
const QB_ENVIRONMENT = process.env.QB_ENVIRONMENT || 'sandbox'

export async function getQBClient(clientId: string) {
  const client = await db.client.findUnique({
    where: { id: clientId }
  })

  if (!client) {
    throw new Error('Client not found')
  }

  // Check if token is expired
  if (new Date() >= new Date(client.qbTokenExpiry)) {
    // Refresh token
    const qbo = new QuickBooks(
      QB_CLIENT_ID,
      QB_CLIENT_SECRET,
      '',
      false,
      client.qbRealmId,
      client.qbEnvironment === 'sandbox',
      true,
      null,
      '2.0'
    )

    const refreshed = await new Promise<any>((resolve, reject) => {
      qbo.refreshAccessToken(client.qbRefreshToken, (err: any, response: any) => {
        if (err) reject(err)
        else resolve(response)
      })
    })

    // Update tokens in database
    await db.client.update({
      where: { id: clientId },
      data: {
        qbAccessToken: refreshed.access_token,
        qbRefreshToken: refreshed.refresh_token,
        qbTokenExpiry: new Date(Date.now() + refreshed.expires_in * 1000),
      }
    })

    return new QuickBooks(
      QB_CLIENT_ID,
      QB_CLIENT_SECRET,
      refreshed.access_token,
      false,
      client.qbRealmId,
      client.qbEnvironment === 'sandbox',
      true,
      null,
      '2.0'
    )
  }

  return new QuickBooks(
    QB_CLIENT_ID,
    QB_CLIENT_SECRET,
    client.qbAccessToken,
    false,
    client.qbRealmId,
    client.qbEnvironment === 'sandbox',
    true,
    null,
    '2.0'
  )
}

export async function syncTransactionsForClient(clientId: string) {
  const qbo = await getQBClient(clientId)
  const client = await db.client.findUnique({ where: { id: clientId } })

  if (!client) {
    throw new Error('Client not found')
  }

  // Fetch purchases from last 90 days
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 90)
  const query = `SELECT * FROM Purchase WHERE TxnDate >= '${startDate.toISOString().split('T')[0]}' MAXRESULTS 1000`

  const purchases = await new Promise<any>((resolve, reject) => {
    qbo.query(query, (err: any, response: any) => {
      if (err) reject(err)
      else resolve(response)
    })
  })

  let imported = 0
  let skipped = 0

  for (const purchase of purchases.QueryResponse?.Purchase || []) {
    // Check if transaction already exists
    const existing = await db.transaction.findUnique({
      where: { qbId: purchase.Id }
    })

    if (existing) {
      skipped++
      continue
    }

    // Create transaction
    await db.transaction.create({
      data: {
        clientId: client.id,
        qbId: purchase.Id,
        qbType: 'Purchase',
        date: new Date(purchase.TxnDate),
        amount: purchase.TotalAmt || 0,
        description: purchase.PrivateNote || '',
        vendor: purchase.EntityRef?.name || null,
        memo: purchase.PrivateNote || null,
        originalAccountId: purchase.AccountRef?.value || null,
        originalAccountName: purchase.AccountRef?.name || null,
        status: 'PENDING',
      }
    })

    imported++
  }

  // Update last sync time
  await db.client.update({
    where: { id: clientId },
    data: { lastSyncAt: new Date() }
  })

  return { imported, skipped }
}

export async function syncCategorizationToQB(transactionId: string) {
  const transaction = await db.transaction.findUnique({
    where: { id: transactionId },
    include: { client: true }
  })

  if (!transaction) {
    throw new Error('Transaction not found')
  }

  if (!transaction.finalAccountId) {
    throw new Error('Transaction has no final categorization')
  }

  const qbo = await getQBClient(transaction.clientId)

  // Update the transaction in QuickBooks
  // This is a simplified example - actual implementation depends on transaction type
  try {
    // For a Purchase transaction:
    const qbTransaction = await new Promise<any>((resolve, reject) => {
      qbo.getPurchase(transaction.qbId, (err: any, response: any) => {
        if (err) reject(err)
        else resolve(response)
      })
    })

    // Update account reference
    qbTransaction.AccountRef = {
      value: transaction.finalAccountId,
      name: transaction.finalAccountName,
    }

    if (transaction.finalClassId) {
      qbTransaction.ClassRef = {
        value: transaction.finalClassId,
        name: transaction.finalClassName,
      }
    }

    const updated = await new Promise<any>((resolve, reject) => {
      qbo.updatePurchase(qbTransaction, (err: any, response: any) => {
        if (err) reject(err)
        else resolve(response)
      })
    })

    // Mark as synced
    await db.transaction.update({
      where: { id: transactionId },
      data: {
        syncedToQb: true,
        syncedAt: new Date(),
        status: 'SYNCED',
      }
    })

    return updated
  } catch (error: any) {
    // Log error
    await db.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'ERROR',
        syncError: error.message,
      }
    })
    throw error
  }
}


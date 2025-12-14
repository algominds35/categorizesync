import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import {
  createQBServiceForClient,
  QBTransaction,
} from '@/lib/services/quickbooks-service'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request body
    const body = await request.json()
    const { clientId, startDate, endDate } = body

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    // Verify user owns this client
    const client = await db.client.findFirst({
      where: {
        id: clientId,
        userId: userId,
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found or unauthorized' },
        { status: 404 }
      )
    }

    // Initialize QuickBooks service
    const qbService = await createQBServiceForClient(clientId)

    // Fetch transactions from QuickBooks
    const qbTransactions = await qbService.fetchUncategorizedTransactions(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    )

    console.log(`Fetched ${qbTransactions.length} transactions from QuickBooks`)

    // Fetch accounts and classes for reference
    const [accounts, classes] = await Promise.all([
      qbService.fetchAccounts(),
      qbService.fetchClasses(),
    ])

    // Cache accounts and classes in database
    await cacheQBAccountsAndClasses(clientId, accounts, classes)

    // Parse and store transactions
    const storedTransactions = await Promise.all(
      qbTransactions.map((qbTxn) =>
        storeTransaction(clientId, qbTxn)
      )
    )

    // Filter out nulls (duplicates)
    const newTransactions = storedTransactions.filter((t) => t !== null)

    // Update last sync time
    await db.client.update({
      where: { id: clientId },
      data: { lastSyncAt: new Date() },
    })

    return NextResponse.json({
      success: true,
      transactionsFetched: qbTransactions.length,
      transactionsStored: newTransactions.length,
      transactionsSkipped: qbTransactions.length - newTransactions.length,
      message: `Successfully synced ${newTransactions.length} new transactions`,
    })
  } catch (error: any) {
    console.error('Error syncing transactions:', error)
    return NextResponse.json(
      {
        error: 'Failed to sync transactions',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * Store transaction in database
 */
async function storeTransaction(
  clientId: string,
  qbTxn: QBTransaction
): Promise<any> {
  try {
    // Check if transaction already exists
    const existing = await db.transaction.findUnique({
      where: { qbId: qbTxn.Id },
    })

    if (existing) {
      console.log(`Transaction ${qbTxn.Id} already exists, skipping`)
      return null
    }

    // Extract transaction details
    const firstLine = qbTxn.Line?.[0] || {}
    const accountDetail = firstLine.AccountBasedExpenseLineDetail

    const vendor = qbTxn.EntityRef?.type === 'Vendor' ? qbTxn.EntityRef.name : null
    const customer = qbTxn.EntityRef?.type === 'Customer' ? qbTxn.EntityRef.name : null

    // Determine transaction type
    let qbType = 'Unknown'
    if (qbTxn.hasOwnProperty('Purchase')) qbType = 'Purchase'
    else if (qbTxn.hasOwnProperty('Expense')) qbType = 'Expense'
    else if (qbTxn.hasOwnProperty('JournalEntry')) qbType = 'JournalEntry'

    // Create transaction
    const transaction = await db.transaction.create({
      data: {
        clientId,
        qbId: qbTxn.Id,
        qbType,
        date: new Date(qbTxn.TxnDate),
        amount: Math.abs(qbTxn.TotalAmt),
        description: qbTxn.PrivateNote || qbTxn.DocNumber || '',
        vendor,
        customer,
        memo: qbTxn.PrivateNote || null,
        originalAccountId: accountDetail?.AccountRef?.value || null,
        originalAccountName: accountDetail?.AccountRef?.name || null,
        originalClassId: accountDetail?.ClassRef?.value || null,
        originalClassName: accountDetail?.ClassRef?.name || null,
        status: 'PENDING',
      },
    })

    return transaction
  } catch (error) {
    console.error('Error storing transaction:', error)
    return null
  }
}

/**
 * Cache QB accounts and classes in database
 */
async function cacheQBAccountsAndClasses(
  clientId: string,
  accounts: any[],
  classes: any[]
) {
  try {
    // Store accounts
    for (const account of accounts) {
      await db.qBAccount.upsert({
        where: {
          clientId_qbId: {
            clientId,
            qbId: account.Id,
          },
        },
        create: {
          clientId,
          qbId: account.Id,
          name: account.Name,
          fullyQualifiedName: account.FullyQualifiedName,
          accountType: account.AccountType,
          accountSubType: account.AccountSubType || null,
          classification: account.Classification || null,
          active: account.Active !== false,
        },
        update: {
          name: account.Name,
          fullyQualifiedName: account.FullyQualifiedName,
          accountType: account.AccountType,
          accountSubType: account.AccountSubType || null,
          classification: account.Classification || null,
          active: account.Active !== false,
        },
      })
    }

    // Store classes
    for (const qbClass of classes) {
      await db.qBClass.upsert({
        where: {
          clientId_qbId: {
            clientId,
            qbId: qbClass.Id,
          },
        },
        create: {
          clientId,
          qbId: qbClass.Id,
          name: qbClass.Name,
          fullyQualifiedName: qbClass.FullyQualifiedName,
          active: qbClass.Active !== false,
        },
        update: {
          name: qbClass.Name,
          fullyQualifiedName: qbClass.FullyQualifiedName,
          active: qbClass.Active !== false,
        },
      })
    }

    console.log(`Cached ${accounts.length} accounts and ${classes.length} classes`)
  } catch (error) {
    console.error('Error caching accounts/classes:', error)
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { createQBServiceForClient } from '@/lib/services/quickbooks-service'
import { QBTransaction } from '@/types/quickbooks'
import { categorizeTransaction } from '@/lib/services/ai-categorization-service'

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find user in database
    const user = await db.user.findUnique({
      where: { clerkId: clerkUserId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
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
        userId: user.id,
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

    // Auto-categorize new transactions using AI
    let categorized = 0
    let categorizationErrors = 0

    if (newTransactions.length > 0) {
      console.log(`Starting AI categorization for ${newTransactions.length} transactions...`)
      
      for (const transaction of newTransactions) {
        try {
          await categorizeTransaction(transaction.id)
          categorized++
        } catch (error: any) {
          console.error(`Error categorizing transaction ${transaction.id}:`, error)
          categorizationErrors++
        }
      }

      console.log(`AI categorization complete: ${categorized} categorized, ${categorizationErrors} errors`)
    }

    return NextResponse.json({
      success: true,
      transactionsFetched: qbTransactions.length,
      transactionsStored: newTransactions.length,
      transactionsSkipped: qbTransactions.length - newTransactions.length,
      categorized,
      categorizationErrors,
      message: `Successfully synced ${newTransactions.length} new transactions${categorized > 0 ? ` and categorized ${categorized} with AI` : ''}`,
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
  qbTxn: any
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

    // Determine transaction type and extract details accordingly
    let qbType = 'Unknown'
    let vendor = null
    let customer = null
    let description = ''
    let memo = null
    let accountId = null
    let accountName = null
    let classId = null
    let className = null
    
    // Check for Purchase (includes checks, credit card charges, cash purchases)
    if (qbTxn.PaymentType !== undefined) {
      qbType = 'Purchase'
      vendor = qbTxn.EntityRef?.name || null
      
      // Get description from first line or PrivateNote
      const firstLine = qbTxn.Line?.[0]
      if (firstLine) {
        description = firstLine.Description || qbTxn.PrivateNote || qbTxn.DocNumber || ''
        
        // Get account from line detail
        const accountDetail = firstLine.AccountBasedExpenseLineDetail
        if (accountDetail) {
          accountId = accountDetail.AccountRef?.value || null
          accountName = accountDetail.AccountRef?.name || null
          classId = accountDetail.ClassRef?.value || null
          className = accountDetail.ClassRef?.name || null
        }
      }
      memo = qbTxn.PrivateNote || null
    }
    // Check for Bill
    else if (qbTxn.VendorRef !== undefined) {
      qbType = 'Bill'
      vendor = qbTxn.VendorRef?.name || null
      
      // Get description from first line
      const firstLine = qbTxn.Line?.[0]
      if (firstLine) {
        description = firstLine.Description || qbTxn.PrivateNote || qbTxn.DocNumber || ''
        
        // Get account from line detail
        const accountDetail = firstLine.AccountBasedExpenseLineDetail
        if (accountDetail) {
          accountId = accountDetail.AccountRef?.value || null
          accountName = accountDetail.AccountRef?.name || null
          classId = accountDetail.ClassRef?.value || null
          className = accountDetail.ClassRef?.name || null
        }
      }
      memo = qbTxn.PrivateNote || null
    }
    // Check for JournalEntry
    else if (qbTxn.Line && qbTxn.Line[0]?.JournalEntryLineDetail) {
      qbType = 'JournalEntry'
      description = qbTxn.PrivateNote || qbTxn.DocNumber || 'Journal Entry'
      
      // Get first debit line
      const debitLine = qbTxn.Line.find((line: any) => line.JournalEntryLineDetail?.PostingType === 'Debit')
      if (debitLine) {
        const journalDetail = debitLine.JournalEntryLineDetail
        accountId = journalDetail.AccountRef?.value || null
        accountName = journalDetail.AccountRef?.name || null
        classId = journalDetail.ClassRef?.value || null
        className = journalDetail.ClassRef?.name || null
      }
      memo = qbTxn.PrivateNote || null
    }

    console.log(`Storing ${qbType} transaction:`, {
      id: qbTxn.Id,
      vendor,
      customer,
      description: description.substring(0, 50),
      amount: qbTxn.TotalAmt
    })

    // Create transaction
    const transaction = await db.transaction.create({
      data: {
        clientId,
        qbId: qbTxn.Id,
        qbType,
        date: new Date(qbTxn.TxnDate),
        amount: Math.abs(qbTxn.TotalAmt || 0),
        description,
        vendor,
        customer,
        memo,
        originalAccountId: accountId,
        originalAccountName: accountName,
        originalClassId: classId,
        originalClassName: className,
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

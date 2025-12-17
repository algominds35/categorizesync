import OpenAI from 'openai'
import { db } from '@/lib/db'
import { Pinecone } from '@pinecone-database/pinecone'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
  environment: process.env.PINECONE_ENVIRONMENT!,
})

export async function categorizeTransaction(transactionId: string) {
  const transaction = await db.transaction.findUnique({
    where: { id: transactionId },
    include: {
      client: true,
    }
  })

  if (!transaction) {
    throw new Error('Transaction not found')
  }

  // Get available accounts for this client from cache
  const accounts = await db.qBAccount.findMany({
    where: {
      clientId: transaction.clientId,
      active: true,
    }
  })

  const classes = await db.qBClass.findMany({
    where: {
      clientId: transaction.clientId,
      active: true,
    }
  })

  // Search for similar past categorizations using Pinecone
  const similarExamples = await findSimilarLearningExamples(
    transaction.clientId,
    transaction.description || '',
    transaction.vendor || ''
  )

  // Build prompt for GPT-4
  const prompt = buildCategorizationPrompt(
    transaction,
    accounts,
    classes,
    similarExamples
  )

  // Call GPT-4
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'You are an expert bookkeeper specializing in QuickBooks categorization. You categorize transactions with high accuracy based on transaction details and historical patterns.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.1,
    response_format: { type: 'json_object' }
  })

  const result = JSON.parse(completion.choices[0].message.content || '{}')

  // Update transaction with AI categorization
  await db.transaction.update({
    where: { id: transactionId },
    data: {
      aiAccountId: result.accountId,
      aiAccountName: result.accountName,
      aiClassId: result.classId || null,
      aiClassName: result.className || null,
      aiConfidenceScore: result.confidence,
      aiReasoningNotes: result.reasoning,
      status: 'PENDING',
    }
  })

  return result
}

function buildCategorizationPrompt(
  transaction: any,
  accounts: any[],
  classes: any[],
  similarExamples: any[]
): string {
  const accountsList = accounts.map(a => 
    `- ${a.name} (ID: ${a.qbId}, Type: ${a.accountType})`
  ).join('\n')

  const classList = classes.length > 0 
    ? classes.map(c => `- ${c.name} (ID: ${c.qbId})`).join('\n')
    : 'No classes available'

  const examplesText = similarExamples.length > 0
    ? similarExamples.map(ex => 
        `- Description: "${ex.description}" → Account: ${ex.correctAccountName}`
      ).join('\n')
    : 'No similar past examples found'

  return `
Categorize this QuickBooks transaction:

TRANSACTION DETAILS:
- Description: ${transaction.description || 'N/A'}
- Vendor: ${transaction.vendor || 'N/A'}
- Amount: $${transaction.amount}
- Date: ${transaction.date}
- Memo: ${transaction.memo || 'N/A'}

AVAILABLE ACCOUNTS:
${accountsList}

AVAILABLE CLASSES:
${classList}

SIMILAR PAST CATEGORIZATIONS:
${examplesText}

Please provide your categorization in this exact JSON format:
{
  "accountId": "the QuickBooks account ID",
  "accountName": "the account name",
  "classId": "the QuickBooks class ID (optional)",
  "className": "the class name (optional)",
  "confidence": 0.95,
  "reasoning": "Brief explanation of why you chose this categorization"
}

Base your categorization on:
1. The transaction description and vendor
2. Similar past categorizations if available
3. Standard bookkeeping practices
4. The account types available

Provide a confidence score between 0 and 1.
`
}

async function findSimilarLearningExamples(
  clientId: string,
  description: string,
  vendor: string
): Promise<any[]> {
  try {
    // Generate embedding for the query
    const queryText = `${description} ${vendor}`.trim()
    
    const embedding = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: queryText,
    })

    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!)

    // Search Pinecone for similar examples
    const queryResponse = await index.query({
      vector: embedding.data[0].embedding,
      topK: 5,
      filter: {
        clientId: { $eq: clientId }
      },
      includeMetadata: true,
    })

    // Fetch full learning examples from database
    const exampleIds = queryResponse.matches
      .filter(m => (m.score || 0) > 0.8) // Only high similarity
      .map(m => m.id)

    if (exampleIds.length === 0) return []

    const examples = await db.learningExample.findMany({
      where: {
        pineconeId: { in: exampleIds }
      }
    })

    return examples
  } catch (error) {
    console.error('Error finding similar examples:', error)
    return []
  }
}

export async function createLearningExample(transactionId: string) {
  const transaction = await db.transaction.findUnique({
    where: { id: transactionId }
  })

  if (!transaction || !transaction.finalAccountId) {
    throw new Error('Transaction must be categorized first')
  }

  // Check if learning example already exists
  const existing = await db.learningExample.findUnique({
    where: { transactionId }
  })

  if (existing) {
    return existing
  }

  // Generate embedding
  const queryText = `${transaction.description} ${transaction.vendor}`.trim()
  
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: queryText,
  })

  const embeddingVector = embedding.data[0].embedding

  // Create learning example
  const learningExample = await db.learningExample.create({
    data: {
      clientId: transaction.clientId,
      transactionId: transaction.id,
      description: transaction.description || '',
      vendor: transaction.vendor || null,
      amount: transaction.amount,
      correctAccountId: transaction.finalAccountId,
      correctAccountName: transaction.finalAccountName!,
      correctClassId: transaction.finalClassId || null,
      correctClassName: transaction.finalClassName || null,
      aiAccountId: transaction.aiAccountId || null,
      aiAccountName: transaction.aiAccountName || null,
      wasCorrect: transaction.aiAccountId === transaction.finalAccountId,
      embedding: embeddingVector,
    }
  })

  // Store in Pinecone (in production, use a queue)
  try {
    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!)
    
    await index.upsert([
      {
        id: learningExample.id,
        values: embeddingVector,
        metadata: {
          clientId: transaction.clientId,
          description: transaction.description || '',
          vendor: transaction.vendor || '',
          accountId: transaction.finalAccountId,
          accountName: transaction.finalAccountName!,
        }
      }
    ])

    await db.learningExample.update({
      where: { id: learningExample.id },
      data: {
        pineconeId: learningExample.id,
        syncedToPinecone: true,
      }
    })
  } catch (error) {
    console.error('Error syncing to Pinecone:', error)
  }

  return learningExample
}


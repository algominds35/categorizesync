# Architecture Documentation

## System Overview

QB AI Categorizer is a full-stack SaaS application that uses AI to automate QuickBooks transaction categorization for bookkeepers.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         USER (Bookkeeper)                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTPS
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js 14)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Landing Page │  │  Dashboard   │  │ Review UI    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         shadcn/ui Components (Tailwind CSS)         │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ API Routes
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (Next.js API Routes)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ QB OAuth     │  │ Transaction  │  │ AI Service   │     │
│  │ /api/qb/*    │  │ Sync         │  │ /api/ai/*    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│  ┌──────┴──────────────────┴──────────────────┴───────┐    │
│  │         Service Layer (Business Logic)             │    │
│  │  - quickbooks-service.ts                           │    │
│  │  - ai-categorization-service.ts                    │    │
│  │  - stripe-service.ts                               │    │
│  └────────────────────────────────────────────────────┘    │
└───┬──────────────────┬───────────────────┬──────────────┬──┘
    │                  │                   │              │
    │                  │                   │              │
    ▼                  ▼                   ▼              ▼
┌────────┐      ┌─────────────┐    ┌──────────┐   ┌──────────┐
│QuickBooks│    │  PostgreSQL │    │  OpenAI  │   │ Pinecone │
│   API    │    │  (Supabase) │    │  GPT-4   │   │ Vector   │
│          │    │             │    │          │   │    DB    │
└────────┘      └─────────────┘    └──────────┘   └──────────┘
                       │
                       │ Prisma ORM
                       │
              ┌────────▼────────┐
              │  Database       │
              │  - Users        │
              │  - Clients      │
              │  - Transactions │
              │  - Learning     │
              └─────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Clerk   │  │  Stripe  │  │ Upstash  │  │  Vercel  │   │
│  │   Auth   │  │ Billing  │  │  Redis   │  │ Hosting  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Onboarding Flow

```
User Signs Up (Clerk)
    ↓
User Record Created in DB
    ↓
Redirect to Dashboard
    ↓
User Connects QuickBooks
    ↓
OAuth Flow → QB Tokens Stored
    ↓
Client Record Created
```

### 2. Transaction Categorization Flow

```
User Triggers Sync
    ↓
Pull Transactions from QB API
    ↓
Store in Database (Status: PENDING)
    ↓
For Each Transaction:
    ├─ Fetch Similar Past Categorizations (Pinecone)
    ├─ Fetch Available Accounts & Classes (QB API)
    ├─ Call GPT-4 with Context
    └─ Store AI Suggestion + Confidence Score
    ↓
Display in Review Dashboard
    ↓
User Approves/Edits
    ↓
Sync Back to QuickBooks
    ↓
Create Learning Example
    ↓
Store Embedding in Pinecone
```

### 3. Learning Loop

```
User Corrects AI Suggestion
    ↓
Store Correction as Learning Example
    ↓
Generate Text Embedding (OpenAI)
    ↓
Store in Pinecone with Metadata
    ↓
Future Similar Transactions:
    ├─ Query Pinecone for Similar Examples
    ├─ Use Past Corrections in GPT-4 Prompt
    └─ Improve Accuracy Over Time
```

## Database Schema

See `prisma/schema.prisma` for full schema.

### Core Models

**User** (Bookkeeper)
- Links to Clerk authentication
- Has many Clients
- Tracks Stripe subscription

**Client** (QuickBooks Company)
- Belongs to User
- Stores QB OAuth tokens
- Has many Transactions
- Has cached Accounts & Classes

**Transaction**
- Belongs to Client
- Stores QB transaction data
- Stores AI categorization
- Stores final categorization
- Tracks sync status

**LearningExample**
- Belongs to Client & Transaction
- Stores correction data
- Stores embedding vector
- Links to Pinecone

## API Routes

### QuickBooks Integration

```
GET  /api/quickbooks/connect
  → Initiates OAuth flow

GET  /api/quickbooks/callback
  → Handles OAuth callback, stores tokens

POST /api/quickbooks/sync
  → Syncs transactions from QB

POST /api/quickbooks/sync-back
  → Syncs categorizations back to QB
```

### Transaction Management

```
GET  /api/transactions
  → Fetch transactions for client

POST /api/transactions/sync
  → Trigger sync from QuickBooks

POST /api/transactions/categorize
  → Run AI categorization

POST /api/transactions/approve
  → Approve AI suggestion

POST /api/transactions/update
  → Edit categorization

POST /api/transactions/bulk-approve
  → Approve multiple transactions
```

### AI Services

```
POST /api/ai/categorize
  → Categorize single transaction

POST /api/ai/batch-categorize
  → Categorize multiple transactions

GET  /api/ai/similar-examples
  → Get similar past categorizations
```

### Webhooks

```
POST /api/webhooks/stripe
  → Handle Stripe subscription events

POST /api/webhooks/quickbooks
  → Handle QB webhook events (optional)
```

## Service Layer

### quickbooks-service.ts

- `getQBClient(clientId)` - Get authenticated QB client
- `syncTransactionsForClient(clientId)` - Pull transactions
- `syncCategorizationToQB(transactionId)` - Push categorizations
- `refreshQBTokens(clientId)` - Refresh OAuth tokens
- `fetchAccounts(clientId)` - Get chart of accounts
- `fetchClasses(clientId)` - Get classes

### ai-categorization-service.ts

- `categorizeTransaction(transactionId)` - AI categorization
- `batchCategorize(transactionIds)` - Batch processing
- `findSimilarLearningExamples()` - Vector search
- `createLearningExample(transactionId)` - Store correction
- `buildCategorizationPrompt()` - GPT-4 prompt builder

### stripe-service.ts (Week 6-7)

- `createCustomer(userId)` - Create Stripe customer
- `createSubscription(userId)` - Start subscription
- `updateUsage(userId, clientCount)` - Track metered usage
- `handleWebhook(event)` - Process Stripe events

## Technology Choices

### Why Next.js 14?
- **App Router:** Modern file-based routing
- **Server Components:** Better performance
- **API Routes:** Backend without separate server
- **Vercel Deployment:** Seamless hosting

### Why Prisma?
- **Type Safety:** Full TypeScript support
- **Migrations:** Easy schema changes
- **Studio:** Great dev experience
- **Supabase Support:** Works perfectly with Postgres

### Why GPT-4 + Pinecone?
- **GPT-4:** Best-in-class reasoning for categorization
- **Pinecone:** Fast vector search for learning
- **Embeddings:** Capture semantic similarity
- **Cost-Effective:** Only call GPT-4 once per transaction

### Why Clerk?
- **Quick Setup:** Auth in minutes
- **Great UX:** Beautiful sign-in/up flows
- **Webhooks:** Sync user data easily
- **Free Tier:** Good for MVP

### Why BullMQ?
- **Job Queues:** Handle long-running tasks
- **Retry Logic:** Automatic error handling
- **Scheduled Jobs:** Auto-sync transactions
- **Redis-Based:** Fast and reliable

## Security Considerations

### QuickBooks Tokens
- Stored encrypted in database
- Auto-refreshed before expiry
- Never exposed to frontend

### API Keys
- Server-side only
- Environment variables
- Never in git

### User Data
- Clerk handles auth
- Prisma parameterized queries (SQL injection safe)
- HTTPS only in production

### Rate Limiting
- Implement on API routes (Week 3)
- Protect against abuse
- Per-user limits

## Performance Optimization

### Database
- Indexed fields: `userId`, `clientId`, `status`, `qbId`
- Connection pooling (Supabase pgBouncer)
- Efficient queries with Prisma

### AI Calls
- Cache QB accounts/classes
- Batch categorization
- Background jobs for non-urgent tasks

### Frontend
- Server components by default
- Client components only when needed
- Lazy loading
- Code splitting

## Scalability

### Horizontal Scaling
- Stateless API routes
- Redis for shared state
- BullMQ workers can scale independently

### Database
- PostgreSQL scales to millions of rows
- Read replicas for analytics (future)
- Partitioning by client (future)

### Cost Optimization
- Cache AI results
- Batch API calls
- Use GPT-4-mini for simple cases (future)
- Pinecone free tier: 100K vectors

## Monitoring & Observability

### Week 8+ (Launch Prep)
- Vercel Analytics
- Sentry error tracking
- OpenAI usage monitoring
- Database query performance
- User behavior analytics

## Deployment Strategy

### Staging Environment
- Separate Vercel project
- QB Sandbox environment
- Test Stripe keys
- Test database

### Production
- Vercel production
- QB Production environment
- Live Stripe keys
- Production database
- Environment variables in Vercel

## Testing Strategy

### Unit Tests (Future)
- Service functions
- Utility functions
- API route handlers

### Integration Tests (Future)
- QuickBooks OAuth flow
- Transaction sync
- AI categorization
- Stripe webhooks

### E2E Tests (Future)
- Critical user flows
- Cypress or Playwright

---

**This architecture supports:**
- ✅ 7-figure revenue potential
- ✅ Thousands of concurrent users
- ✅ Millions of transactions
- ✅ Sub-second response times
- ✅ 99.9% uptime


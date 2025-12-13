# QB AI Categorizer

🚀 **AI-powered transaction categorization for QuickBooks bookkeepers**

Save 70% of your categorization time. Let GPT-4 do the heavy lifting while you focus on high-value work.

## 🎯 Product Overview

**Target Users:** Bookkeepers managing 20-100 clients who spend 3-5 hours per client per month manually categorizing transactions

**Value Proposition:**
- 90-95% AI categorization accuracy
- 70% time savings
- Learning system that improves with every correction
- Beautiful review dashboard with keyboard shortcuts

**Pricing:** $49 base + $10 per client/month

## 🏗️ Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes, PostgreSQL (Supabase), Prisma ORM
- **AI:** OpenAI GPT-4, Pinecone (vector DB for learning)
- **Integration:** QuickBooks Online API (OAuth 2.0), node-quickbooks
- **Queue:** BullMQ + Upstash Redis
- **Auth:** Clerk
- **Payments:** Stripe
- **Hosting:** Vercel

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/pnpm
- PostgreSQL database (Supabase recommended)
- QuickBooks Developer Account
- OpenAI API key
- Pinecone account
- Clerk account
- Stripe account
- Upstash Redis instance

### 1. Clone and Install

```bash
git clone <your-repo>
cd qb-ai-categorizer
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/dbname?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/dbname"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# QuickBooks OAuth
QB_CLIENT_ID=your_intuit_client_id
QB_CLIENT_SECRET=your_intuit_client_secret
QB_REDIRECT_URI=http://localhost:3000/api/quickbooks/callback
QB_ENVIRONMENT=sandbox # or "production"

# OpenAI
OPENAI_API_KEY=sk-xxxxx

# Pinecone Vector Database
PINECONE_API_KEY=xxxxx
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX_NAME=qb-categorization

# Upstash Redis (for BullMQ)
UPSTASH_REDIS_URL=xxxxx
UPSTASH_REDIS_TOKEN=xxxxx

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_BASE_PRICE_ID=price_xxxxx
STRIPE_PER_CLIENT_PRICE_ID=price_xxxxx

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Set Up Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

### 4. Set Up QuickBooks Developer Account

1. Go to [QuickBooks Developer Portal](https://developer.intuit.com/)
2. Create a new app
3. Set redirect URI: `http://localhost:3000/api/quickbooks/callback`
4. Get your Client ID and Client Secret
5. Add to `.env.local`

### 5. Set Up Pinecone Vector Database

1. Create account at [Pinecone](https://www.pinecone.io/)
2. Create an index:
   - Name: `qb-categorization`
   - Dimensions: `1536` (for OpenAI text-embedding-3-small)
   - Metric: `cosine`
3. Add credentials to `.env.local`

### 6. Set Up Clerk Authentication

1. Create account at [Clerk](https://clerk.com/)
2. Create a new application
3. Copy API keys to `.env.local`
4. Configure sign-in/sign-up options

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app!

## 📁 Project Structure

```
qb-ai-categorizer/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API routes
│   │   │   ├── quickbooks/       # QuickBooks OAuth & API
│   │   │   ├── transactions/     # Transaction operations
│   │   │   └── webhooks/         # Stripe & QB webhooks
│   │   ├── dashboard/            # Main dashboard pages
│   │   ├── globals.css           # Global styles
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Landing page
│   ├── components/               # React components
│   │   └── ui/                   # shadcn/ui components
│   ├── lib/                      # Utilities and services
│   │   ├── services/             # Business logic
│   │   │   ├── ai-categorization-service.ts
│   │   │   ├── quickbooks-service.ts
│   │   │   └── stripe-service.ts
│   │   ├── db.ts                 # Prisma client
│   │   └── utils.ts              # Helper functions
│   └── middleware.ts             # Clerk auth middleware
├── prisma/
│   └── schema.prisma             # Database schema
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## 🔄 Core Workflow

1. **Connect QuickBooks** → User connects client via OAuth
2. **Pull Transactions** → Sync uncategorized transactions from QB
3. **AI Categorizes** → GPT-4 suggests categories with confidence scores
4. **Review Dashboard** → User reviews with keyboard shortcuts (Space=accept, E=edit)
5. **Approve & Sync** → Categorizations sync back to QuickBooks
6. **AI Learns** → Corrections are stored in Pinecone for future predictions

## 🗄️ Database Schema

### Key Models:

- **User** - Bookkeepers (linked to Clerk)
- **Client** - QuickBooks company accounts
- **Transaction** - Transactions from QB with AI categorization
- **LearningExample** - Corrections used for AI training
- **UsageRecord** - Billing and usage tracking
- **QBAccount** - Cached QB accounts
- **QBClass** - Cached QB classes

## 🎨 Key Features to Build Next

### Week 1 (Foundation) ✅
- [x] Project scaffolding
- [x] Database schema
- [x] Authentication
- [x] Basic dashboard
- [x] QuickBooks OAuth

### Week 2-3 (Core Features)
- [ ] Transaction sync from QuickBooks
- [ ] AI categorization engine
- [ ] Review dashboard with keyboard shortcuts
- [ ] Bulk approve/edit actions
- [ ] Sync categorizations back to QB

### Week 4-5 (Learning & Polish)
- [ ] Learning system (store corrections in Pinecone)
- [ ] Multi-client management
- [ ] Confidence scores and reasoning display
- [ ] Performance metrics dashboard

### Week 6-7 (Monetization)
- [ ] Stripe integration
- [ ] Usage tracking and metered billing
- [ ] Subscription management
- [ ] Billing dashboard

### Week 8 (Launch Prep)
- [ ] Testing and bug fixes
- [ ] Documentation
- [ ] Onboarding flow
- [ ] Beta user testing

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Variables

Make sure to add all environment variables in Vercel dashboard.

### Database

Use Supabase for production PostgreSQL database.

## 💰 Revenue Model

**Hybrid Pricing:**
- Base: $49/month
- Per client: $10/month
- Example: 50 clients = $49 + (50 × $10) = $549/month

**Target:**
- 1,000 bookkeepers
- Average 35 clients each
- ARR: ~$5M-$7M

## 🎯 Market Opportunity

- **TAM:** 1.4M bookkeepers in the US
- **Pain Point:** 60-100 hours/month on categorization
- **Time Savings:** 70% = 42-70 hours saved/month
- **Value:** $2,100-$3,500/month saved per bookkeeper

**This is a 7-figure opportunity with clear product-market fit!**

## 📚 Resources

- [QuickBooks API Docs](https://developer.intuit.com/app/developer/qbo/docs/get-started)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Pinecone Docs](https://docs.pinecone.io/)
- [Clerk Docs](https://clerk.com/docs)
- [Stripe Docs](https://stripe.com/docs)
- [Next.js Docs](https://nextjs.org/docs)

## 📝 License

MIT

---

**Built with ❤️ for bookkeepers who value their time**


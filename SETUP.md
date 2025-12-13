# Setup Guide - Week 1

## 🎯 What We Built

Week 1 Foundation includes:
- ✅ Next.js 14 project with TypeScript
- ✅ Tailwind CSS + shadcn/ui components
- ✅ Prisma ORM with complete database schema
- ✅ Clerk authentication
- ✅ QuickBooks OAuth integration
- ✅ AI categorization service (GPT-4 + Pinecone)
- ✅ Landing page + Dashboard
- ✅ Project structure and architecture

## 📦 Installation Steps

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Prisma
- Clerk
- OpenAI SDK
- Pinecone SDK
- node-quickbooks
- And more...

### 2. Set Up External Services

#### A. Supabase (Database)

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string (with pgbouncer)
5. Also copy the direct connection string
6. Add both to `.env.local` as `DATABASE_URL` and `DIRECT_URL`

#### B. Clerk (Authentication)

1. Go to [clerk.com](https://clerk.com)
2. Create a new application
3. Choose "Email + Password" or your preferred auth methods
4. Copy publishable key and secret key
5. Add to `.env.local`

#### C. QuickBooks Developer Account

1. Go to [developer.intuit.com](https://developer.intuit.com)
2. Create a new app
3. Go to "Keys & OAuth"
4. Copy Client ID and Client Secret
5. Set Redirect URI: `http://localhost:3000/api/quickbooks/callback`
6. Add credentials to `.env.local`

#### D. OpenAI

1. Go to [platform.openai.com](https://platform.openai.com)
2. Create API key
3. Add to `.env.local` as `OPENAI_API_KEY`

#### E. Pinecone

1. Go to [pinecone.io](https://www.pinecone.io)
2. Create a free account
3. Create a new index:
   - **Name:** `qb-categorization`
   - **Dimensions:** `1536` (for OpenAI embeddings)
   - **Metric:** `cosine`
   - **Cloud:** AWS
   - **Region:** us-east-1 (or your preferred region)
4. Copy API key and environment
5. Add to `.env.local`

#### F. Upstash Redis

1. Go to [upstash.com](https://upstash.com)
2. Create a Redis database
3. Copy REST URL and token
4. Add to `.env.local`

#### G. Stripe (Optional for Week 1)

1. Go to [stripe.com](https://stripe.com)
2. Get test mode API keys
3. Add to `.env.local`

### 3. Set Up Database

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database (creates tables)
npm run db:push

# (Optional) Open Prisma Studio to view database
npm run db:studio
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🧪 Testing the Setup

### Test 1: Landing Page
- Visit `http://localhost:3000`
- Should see a beautiful landing page
- Click "Get Started" to test Clerk sign-up

### Test 2: Authentication
- Sign up with email
- Should redirect to `/dashboard`
- User should be created in database

### Test 3: QuickBooks Connection
- Go to Dashboard
- Click "Connect QuickBooks Client"
- Should redirect to QuickBooks OAuth
- After authorization, client should be created

### Test 4: Database
- Run `npm run db:studio`
- Should see Prisma Studio open
- Check that User table has your user
- Check Client table after connecting QB

## 🐛 Common Issues

### Issue: Prisma can't connect to database
**Solution:** 
- Check DATABASE_URL is correct
- Make sure Supabase project is running
- Try using DIRECT_URL for development

### Issue: Clerk redirect not working
**Solution:**
- Check all Clerk environment variables are set
- Make sure URLs don't have trailing slashes
- Clear browser cache

### Issue: QuickBooks OAuth fails
**Solution:**
- Verify redirect URI exactly matches in QB developer portal
- Check QB_CLIENT_ID and QB_CLIENT_SECRET are correct
- Make sure you're using sandbox mode during development

### Issue: Module not found errors
**Solution:**
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

## 📁 Key Files to Know

### Configuration Files
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `next.config.js` - Next.js configuration
- `components.json` - shadcn/ui configuration
- `prisma/schema.prisma` - Database schema

### Application Files
- `src/app/page.tsx` - Landing page
- `src/app/dashboard/page.tsx` - Main dashboard
- `src/app/api/quickbooks/` - QuickBooks OAuth routes
- `src/lib/services/` - Business logic services
- `src/components/ui/` - Reusable UI components

### Environment
- `.env.local` - Your local environment variables (create this!)
- `.env.example` - Example environment variables
- `.gitignore` - Files to ignore in git

## 🎯 Next Steps (Week 2)

Now that the foundation is set up, here's what to build next:

1. **Transaction Sync Service**
   - Pull transactions from QuickBooks
   - Store in database
   - Handle pagination and date ranges

2. **AI Categorization Engine**
   - Fetch QB accounts and classes
   - Run GPT-4 categorization
   - Store results with confidence scores

3. **Review Dashboard**
   - Display pending transactions
   - Show AI suggestions
   - Keyboard shortcuts (Space, E, etc.)

4. **Bulk Actions**
   - Approve all high-confidence
   - Edit multiple transactions
   - Sync back to QuickBooks

## 💡 Pro Tips

1. **Use Prisma Studio during development** - It's great for viewing/editing data
2. **Check QuickBooks sandbox** - Use sandbox mode until you're ready for production
3. **Monitor OpenAI usage** - GPT-4 calls can add up, track your usage
4. **Keep tokens secure** - Never commit `.env.local` to git

## 🚀 You're Ready!

Your Week 1 foundation is complete. You now have:
- ✅ A production-ready tech stack
- ✅ Authentication working
- ✅ QuickBooks integration ready
- ✅ AI services configured
- ✅ Beautiful UI components
- ✅ Solid database schema

Time to build the core features! 🎉

---

Questions? Issues? Open a GitHub issue or reach out!


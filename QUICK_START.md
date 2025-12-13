# Quick Start Guide - Get Running in 15 Minutes

This guide gets you from zero to running the app locally.

## Prerequisites Check

Before starting, make sure you have:
- ✅ Node.js 18+ installed (`node --version`)
- ✅ npm or pnpm installed (`npm --version`)
- ✅ Git installed
- ✅ A code editor (VS Code recommended)

## Step 1: Install Dependencies (2 minutes)

```bash
npm install
```

This installs all packages. Go grab coffee ☕

## Step 2: Set Up Database (3 minutes)

### Option A: Supabase (Recommended)

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new project (choose a region close to you)
4. Wait 2 minutes for setup
5. Go to Settings → Database
6. Copy **Connection string** (with pgbouncer)
7. Also copy **Direct connection string**

### Option B: Local PostgreSQL

```bash
# Mac (with Homebrew)
brew install postgresql
brew services start postgresql
createdb qb_categorizer

# Your DATABASE_URL:
# postgresql://localhost:5432/qb_categorizer
```

## Step 3: Environment Variables (5 minutes)

Create `.env.local` file in root:

```bash
# Copy the template
cp ENV_TEMPLATE.txt .env.local
```

Edit `.env.local` and add at minimum:

```bash
# Database - FROM STEP 2
DATABASE_URL="your_supabase_connection_string"
DIRECT_URL="your_supabase_direct_string"

# Clerk - Quick signup at clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# QuickBooks - We'll skip this for now
QB_CLIENT_ID=skip_for_now
QB_CLIENT_SECRET=skip_for_now
QB_REDIRECT_URI=http://localhost:3000/api/quickbooks/callback
QB_ENVIRONMENT=sandbox

# OpenAI - Optional for now
OPENAI_API_KEY=sk-skip_for_now

# Pinecone - Optional for now
PINECONE_API_KEY=skip_for_now
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX_NAME=qb-categorization

# Redis - Optional for now
UPSTASH_REDIS_URL=skip_for_now
UPSTASH_REDIS_TOKEN=skip_for_now

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**For now, you only NEED:**
- ✅ DATABASE_URL and DIRECT_URL
- ✅ Clerk keys

Everything else is optional to start.

## Step 4: Set Up Clerk Auth (3 minutes)

1. Go to [clerk.com](https://clerk.com)
2. Sign up (free)
3. Create new application
4. Choose "Email" authentication
5. Copy keys from dashboard to `.env.local`

Done!

## Step 5: Initialize Database (1 minute)

```bash
# Generate Prisma client
npm run db:generate

# Create tables
npm run db:push
```

You should see: ✅ Tables created successfully

## Step 6: Run the App (1 minute)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

You should see a beautiful landing page! 🎉

## Test It Works

### Test 1: Landing Page
- Visit `http://localhost:3000`
- See landing page
- ✅ Success!

### Test 2: Authentication
- Click "Get Started"
- Sign up with email
- Check your email for verification
- Complete signup
- Should redirect to `/dashboard`
- ✅ Success!

### Test 3: Database
```bash
# Open Prisma Studio
npm run db:studio
```
- Should open browser at `localhost:5555`
- Click "User" table
- Should see your user
- ✅ Success!

## Next Steps

### Want to test QuickBooks integration?

1. Get QB Developer Account:
   - Go to [developer.intuit.com](https://developer.intuit.com)
   - Create account (free)
   - Create new app
   - Get Client ID & Secret
   - Add to `.env.local`

2. Restart dev server:
   ```bash
   # Ctrl+C to stop, then:
   npm run dev
   ```

3. Test:
   - Go to Dashboard
   - Click "Connect QuickBooks"
   - Should redirect to QB OAuth
   - ✅ Success!

### Want to test AI categorization?

1. Get OpenAI API Key:
   - Go to [platform.openai.com](https://platform.openai.com)
   - Create account
   - Add $5 credit
   - Create API key
   - Add to `.env.local` as `OPENAI_API_KEY`

2. Get Pinecone Account:
   - Go to [pinecone.io](https://pinecone.io)
   - Sign up (free tier)
   - Create index:
     - Name: `qb-categorization`
     - Dimensions: `1536`
     - Metric: `cosine`
   - Add API key to `.env.local`

3. Restart and test AI features

## Troubleshooting

### "Cannot connect to database"
- Check DATABASE_URL is correct
- Check Supabase project is running
- Try using DIRECT_URL instead

### "Clerk is not configured"
- Check all Clerk env variables are set
- Make sure they start with `pk_test_` and `sk_test_`
- Restart dev server after adding keys

### "Module not found"
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

### "Prisma error"
```bash
npm run db:generate
npm run db:push
```

### Port 3000 already in use
```bash
# Kill the process
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

## Development Tips

### Hot Reload
- Save any file
- Browser auto-refreshes
- No need to restart server (usually)

### Database Changes
1. Edit `prisma/schema.prisma`
2. Run `npm run db:push`
3. Run `npm run db:generate`

### View Database
```bash
npm run db:studio
```
Opens visual database editor

### Check Logs
- Server logs: In terminal where you ran `npm run dev`
- Browser logs: F12 → Console tab

## You're All Set! 🎉

Your development environment is ready. Time to build Week 2 features!

**What to build next:**
1. Transaction sync from QuickBooks
2. AI categorization engine
3. Review dashboard

See `ROADMAP.md` for full plan.

---

**Need help?**
- Check `README.md` for detailed docs
- Check `SETUP.md` for service-by-service setup
- Check `ARCHITECTURE.md` to understand the system


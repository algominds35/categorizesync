import { SignInButton, SignUpButton } from '@clerk/nextjs'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Zap, Brain, TrendingUp } from 'lucide-react'

export default async function Home() {
  const user = await currentUser()
  
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="text-2xl font-bold text-blue-600">QB AI Categorizer</div>
        <div className="flex gap-4">
          <SignInButton mode="modal">
            <Button variant="ghost">Sign In</Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button>Get Started</Button>
          </SignUpButton>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Stop Manually Categorizing<br />
          <span className="text-blue-600">QuickBooks Transactions</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          AI-powered categorization that learns from you. Save 70% of your time and serve more clients.
        </p>
        <div className="flex gap-4 justify-center">
          <SignUpButton mode="modal">
            <Button size="lg" className="text-lg px-8">
              Start Free Trial
            </Button>
          </SignUpButton>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          14-day free trial • No credit card required
        </p>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">90-95%</div>
            <div className="text-gray-600">Accuracy Rate</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">70%</div>
            <div className="text-gray-600">Time Saved</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">3-5hrs</div>
            <div className="text-gray-600">Saved Per Client/Month</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">1. Connect QuickBooks</h3>
            <p className="text-sm text-gray-600">
              Secure OAuth connection to your clients&apos; QuickBooks accounts
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">2. AI Categorizes</h3>
            <p className="text-sm text-gray-600">
              GPT-4 analyzes transactions and suggests categories with confidence scores
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Brain className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">3. Review & Approve</h3>
            <p className="text-sm text-gray-600">
              Quick review dashboard with keyboard shortcuts (Space to approve!)
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">4. Learns & Improves</h3>
            <p className="text-sm text-gray-600">
              AI learns from your corrections and gets smarter over time
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 border-2 border-blue-500">
          <h3 className="text-2xl font-bold mb-4 text-center">Simple, Scalable Pricing</h3>
          <div className="text-center mb-6">
            <div className="text-5xl font-bold text-gray-900 mb-2">$49</div>
            <div className="text-gray-600">base + $10 per client/month</div>
          </div>
          <ul className="space-y-3 mb-8">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
              <span>Unlimited transactions</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
              <span>AI learning per client</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
              <span>Bulk approve actions</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
              <span>Auto-sync to QuickBooks</span>
            </li>
          </ul>
          <SignUpButton mode="modal">
            <Button className="w-full" size="lg">
              Start Free Trial
            </Button>
          </SignUpButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600 border-t">
        <p>&copy; 2024 QB AI Categorizer. Built for bookkeepers who value their time.</p>
      </footer>
    </div>
  )
}


import { SignInButton, SignUpButton } from '@clerk/nextjs'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, ArrowRight, Shield, Brain, Zap } from 'lucide-react'

export default async function Home() {
  const user = await currentUser()
  
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center max-w-6xl">
          <div className="text-2xl font-bold text-gray-900">ReconcileBook</div>
          <div className="flex gap-3">
            <SignInButton mode="modal">
              <Button variant="ghost" size="lg">Sign In</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Get Early Access
              </Button>
            </SignUpButton>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-28 max-w-6xl">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-block mb-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
            For Bookkeepers & Accounting Firms
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Stop fixing QuickBooks AI mistakes at 11 PM
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed">
            A review layer between AI categorization and your books. Nothing posts without your approval. The AI learns from your decisions, not its mistakes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <SignUpButton mode="modal">
              <Button size="lg" className="text-lg px-8 py-6 bg-blue-600 hover:bg-blue-700">
                Request Beta Access <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </SignUpButton>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            Currently working with 12 bookkeeping firms in private beta
          </p>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 bg-white border-y">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
              You know exactly what we're talking about
            </h2>
            <div className="space-y-6">
              <div className="flex gap-4 items-start p-6 bg-red-50 rounded-lg border border-red-100">
                <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-lg">The AI you don't trust</h3>
                  <p className="text-gray-700">
                    QuickBooks auto-categorization gets it right... until it doesn't. A vendor it correctly categorized for six months suddenly goes to the wrong account. No warning. No explanation. You find out during month-end close.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-6 bg-red-50 rounded-lg border border-red-100">
                <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-lg">Rules that silently break</h3>
                  <p className="text-gray-700">
                    You create bank rules to fix it. They work for weeks, then QuickBooks changes how a vendor name appears in the feed and your rule stops matching. You don't notice until you're reconciling.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-6 bg-red-50 rounded-lg border border-red-100">
                <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-lg">Cleanup that destroys your margin</h3>
                  <p className="text-gray-700">
                    You can't bill clients for fixing categorization mistakes. Twenty transactions miscategorized across three months means unpaid hours of cleanup work. Scale that across 30 clients and you're losing thousands in billable time.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-6 bg-red-50 rounded-lg border border-red-100">
                <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-lg">The fear of automation</h3>
                  <p className="text-gray-700">
                    You want automation to save time, but you've been burned. So you manually review everything anyway, which defeats the purpose. You're stuck between slow manual work and risky automation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What if you could trust the AI?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              ReconcileBook is a review layer that sits between AI suggestions and your QuickBooks. You stay in control. The AI gets smarter.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Review Before Posting</h3>
              <p className="text-gray-600 leading-relaxed">
                AI suggests categorizations. You approve, reject, or modify. Nothing touches QuickBooks until you confirm. Every single transaction.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <Brain className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Learns From Your Decisions</h3>
              <p className="text-gray-600 leading-relaxed">
                Each approval trains the AI for that specific client. Over time, suggestions match your categorization patterns—not generic rules that break.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Fast When You Need It</h3>
              <p className="text-gray-600 leading-relaxed">
                Keyboard shortcuts let you review 100 transactions in minutes. High-confidence matches are obvious. Low-confidence ones get your attention.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">How it works</h2>
          <div className="space-y-12">
            <div className="flex gap-8 items-start">
              <div className="flex-shrink-0 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                1
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">Connect QuickBooks</h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Standard OAuth connection. We pull uncategorized transactions from the bank feed. Your credentials stay with Intuit, not us.
                </p>
              </div>
            </div>

            <div className="flex gap-8 items-start">
              <div className="flex-shrink-0 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                2
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">AI Analyzes & Suggests</h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                  GPT-4 categorizes based on vendor, description, amount, and historical patterns from past approvals. You see the suggestion with a confidence score. Nothing is posted yet.
                </p>
              </div>
            </div>

            <div className="flex gap-8 items-start">
              <div className="flex-shrink-0 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                3
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">You Review & Approve</h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                  See all suggestions in one dashboard. High-confidence matches are green. Low-confidence ones are flagged. Approve correct ones with a keystroke. Fix wrong ones before they sync.
                </p>
              </div>
            </div>

            <div className="flex gap-8 items-start">
              <div className="flex-shrink-0 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                4
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">Sync to QuickBooks</h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Only approved transactions update in QuickBooks. You have a full audit trail of what changed. The AI learns from every approval to get better for next time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">Built for professionals who need control</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4 items-start">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">No automatic posting</h3>
                <p className="text-gray-600">
                  Every transaction requires explicit approval. You make the final call, always.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">Client data stays isolated</h3>
                <p className="text-gray-600">
                  Each client has separate learning. Patterns from one never affect another. Your data never trains our models for other users.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">Full audit trail</h3>
                <p className="text-gray-600">
                  See what the AI suggested, what you approved, and when changes synced. Export for client records.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">You own the relationship</h3>
                <p className="text-gray-600">
                  This is your tool. Your clients see your expertise, not our branding. You stay in control of the workflow.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">Who this is for</h2>
          <div className="space-y-6 text-lg">
            <div className="p-6 border-l-4 border-blue-600 bg-blue-50">
              <p className="text-gray-800">
                <strong className="text-gray-900">Bookkeepers managing 10+ clients</strong> who spend hours each week fixing miscategorized transactions
              </p>
            </div>
            <div className="p-6 border-l-4 border-blue-600 bg-blue-50">
              <p className="text-gray-800">
                <strong className="text-gray-900">Accounting firms</strong> where junior staff categorize but partners need oversight before posting
              </p>
            </div>
            <div className="p-6 border-l-4 border-blue-600 bg-blue-50">
              <p className="text-gray-800">
                <strong className="text-gray-900">Experienced QB users</strong> who have tried bank rules and know why they fail at scale
              </p>
            </div>
            <div className="p-6 border-l-4 border-blue-600 bg-blue-50">
              <p className="text-gray-800">
                <strong className="text-gray-900">Anyone billing hourly</strong> who can't afford to waste time on categorization cleanup
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Stop cleaning up AI mistakes
          </h2>
          <p className="text-xl text-blue-100 mb-10 leading-relaxed">
            We're in private beta with a small group of bookkeeping firms. Join the waitlist and we'll reach out when spots open.
          </p>
          <SignUpButton mode="modal">
            <Button size="lg" variant="secondary" className="text-lg px-10 py-6">
              Request Beta Access <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </SignUpButton>
          <p className="text-blue-200 mt-6 text-sm">
            No credit card required • 14-day free trial when you're accepted
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="text-2xl font-bold text-gray-900 mb-4">ReconcileBook</div>
          <p className="text-gray-600 mb-6">
            Built by bookkeepers who got tired of fixing categorization mistakes at month-end.
          </p>
          <p className="text-sm text-gray-500">
            © 2024 ReconcileBook. Not affiliated with Intuit or QuickBooks.
          </p>
        </div>
      </footer>
    </div>
  )
}

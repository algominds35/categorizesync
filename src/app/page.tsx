import { SignInButton, SignUpButton } from '@clerk/nextjs'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Shield, Eye, RotateCcw, FileCheck, Lock, ClipboardCheck } from 'lucide-react'

export default async function Home() {
  const user = await currentUser()
  
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-xl font-semibold text-gray-900">ReconcileBook</div>
          <div className="flex gap-4">
            <SignInButton mode="modal">
              <Button variant="ghost">Sign In</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button variant="outline">Request Beta Access</Button>
            </SignUpButton>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            QuickBooks AI keeps miscategorizing transactions. Rules break silently. You spend hours fixing mistakes.
          </h1>
          <p className="text-xl text-gray-700 mb-8 leading-relaxed">
            This is a review layer that sits between AI suggestions and your books. Nothing posts automatically. You approve every change. The AI learns only from what you approve.
          </p>
          <SignUpButton mode="modal">
            <Button size="lg" className="text-base px-8">
              Request Beta Access
            </Button>
          </SignUpButton>
        </div>
      </section>

      {/* Why This Exists */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Why this exists</h2>
            <div className="prose prose-lg text-gray-700 space-y-4">
              <p>
                QuickBooks bank feed AI is unreliable. It miscategorizes vendors, randomly changes categories it got right before, and gives you no way to understand why it made a decision.
              </p>
              <p>
                Rules help at first, but they do not scale. When you have 30 clients and hundreds of vendor patterns, rules become a maintenance nightmare. They silently break when QuickBooks updates formatting.
              </p>
              <p>
                The real problem is not accuracy—it is trust. You cannot hand off categorization to something that might change your books without warning. Cleanup is expensive, stressful, and makes you look bad to clients.
              </p>
              <p className="font-semibold text-gray-900">
                This tool does not try to replace you. It helps you work faster without losing control.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-12">How it works</h2>
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-900">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Connect your QuickBooks client</h3>
                  <p className="text-gray-700">
                    Standard OAuth connection. Read-only until you explicitly approve changes. No background syncing without your action.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-900">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">AI analyzes and suggests</h3>
                  <p className="text-gray-700">
                    Transactions are categorized based on vendor, description, amount, and patterns from previously approved decisions. You see the suggestion and confidence level. Nothing is posted.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-900">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">You review and approve</h3>
                  <p className="text-gray-700">
                    Every transaction requires your explicit approval. Change the category if it is wrong. Reject if you are unsure. Approve when it is correct. Keyboard shortcuts make this fast.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-900">4</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Changes sync back to QuickBooks</h3>
                  <p className="text-gray-700">
                    Only after you approve, categories update in QuickBooks. You maintain a full audit trail of what changed and when.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-900">5</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">AI learns from your decisions</h3>
                  <p className="text-gray-700">
                    Each approval trains the model for that specific client. Over time, suggestions improve based on your actual categorization patterns—not generic rules.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Assurances */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">What you control</h2>
            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">No automatic posting</h3>
                  <p className="text-gray-700">
                    Nothing touches your books without explicit approval. Every transaction requires a manual review step.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <Eye className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Full audit trail</h3>
                  <p className="text-gray-700">
                    See exactly what changed, when it changed, and what the AI originally suggested versus what you approved.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <RotateCcw className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Reversible actions</h3>
                  <p className="text-gray-700">
                    Approved something by mistake? You can undo it. Changes sync back to QuickBooks only when you confirm.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <Lock className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Client data isolation</h3>
                  <p className="text-gray-700">
                    Each client has separate learning data. Patterns from one client never affect another. Your data never trains models for other users.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <FileCheck className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">You stay in control</h3>
                  <p className="text-gray-700">
                    This is a tool, not a replacement. You make the final call on every categorization. The AI is here to suggest, not decide.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Who this is for</h2>
            <div className="space-y-4 text-gray-700">
              <div className="flex gap-3 items-start">
                <ClipboardCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                <p>
                  <strong className="text-gray-900">Bookkeepers managing multiple clients</strong> who need consistency across dozens or hundreds of accounts
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <ClipboardCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                <p>
                  <strong className="text-gray-900">Accounting firms</strong> where junior staff categorize but partners need oversight and quality control
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <ClipboardCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                <p>
                  <strong className="text-gray-900">Power QuickBooks users</strong> who have already tried rules and auto-categorization and know why they fail at scale
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <ClipboardCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                <p>
                  <strong className="text-gray-900">Small business owners</strong> with high transaction volume who cannot afford cleanup mistakes
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">
              Currently in private beta
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              We are working with a small group of bookkeepers to refine the review workflow and learning system.
            </p>
            <SignUpButton mode="modal">
              <Button size="lg" variant="secondary" className="text-base px-8">
                Request Beta Access
              </Button>
            </SignUpButton>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>ReconcileBook &copy; 2024. Built for bookkeepers who have cleaned up too many categorization mistakes.</p>
        </div>
      </footer>
    </div>
  )
}


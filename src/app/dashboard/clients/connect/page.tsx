'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle2 } from 'lucide-react'

export default function ConnectClientPage() {
  const [loading, setLoading] = useState(false)

  const handleConnect = async () => {
    setLoading(true)
    
    try {
      // Get OAuth URL from API
      const response = await fetch('/api/quickbooks/connect')
      const data = await response.json()
      
      if (data.authUrl) {
        // Redirect to QuickBooks OAuth
        window.location.href = data.authUrl
      }
    } catch (error) {
      console.error('Error connecting to QuickBooks:', error)
      alert('Failed to connect. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Connect QuickBooks Client</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>QuickBooks Online Integration</CardTitle>
            <CardDescription>
              Connect a client&apos;s QuickBooks Online account to start categorizing their transactions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Secure OAuth Connection</p>
                  <p className="text-sm text-gray-600">
                    Your client will authorize access through QuickBooks&apos; official OAuth flow
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Read & Write Permissions</p>
                  <p className="text-sm text-gray-600">
                    We&apos;ll read uncategorized transactions and write back categorizations
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Automatic Token Refresh</p>
                  <p className="text-sm text-gray-600">
                    We handle token management so the connection stays active
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <Button 
                onClick={handleConnect} 
                disabled={loading}
                size="lg"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect to QuickBooks'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


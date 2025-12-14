'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { RefreshCw, Plus, Users, Sparkles, Unplug, Upload } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Client {
  id: string
  name: string
  lastSyncAt: Date | null
  transactions: { id: string }[]
}

interface ClientListProps {
  clients: Client[]
}

export function ClientList({ clients }: ClientListProps) {
  const [syncing, setSyncing] = useState<string | null>(null)
  const [categorizing, setCategorizing] = useState<string | null>(null)
  const [syncingToQB, setSyncingToQB] = useState<string | null>(null)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const { toast } = useToast()

  const handleSync = async (clientId: string) => {
    setSyncing(clientId)
    try {
      const response = await fetch('/api/transactions/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Sync Complete!',
          description: data.message,
        })
        // Refresh the page to show new transactions
        window.location.reload()
      } else {
        toast({
          title: 'Sync Failed',
          description: data.error || 'Failed to sync transactions',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setSyncing(null)
    }
  }

  const handleCategorize = async (clientId: string) => {
    setCategorizing(clientId)
    try {
      const response = await fetch('/api/transactions/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'AI Categorization Complete!',
          description: `Categorized ${data.categorized} transactions with AI`,
        })
        // Refresh the page to show categorized transactions
        window.location.reload()
      } else {
        toast({
          title: 'Categorization Failed',
          description: data.error || 'Failed to categorize transactions',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setCategorizing(null)
    }
  }

  const handleSyncToQB = async (clientId: string) => {
    setSyncingToQB(clientId)
    try {
      const response = await fetch('/api/transactions/sync-to-qb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Sync Complete!',
          description: data.message || `Synced ${data.synced} approved transactions to QuickBooks`,
        })
        // Refresh the page
        window.location.reload()
      } else {
        toast({
          title: 'Sync Failed',
          description: data.error || 'Failed to sync transactions',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setSyncingToQB(null)
    }
  }

  const handleDisconnect = async (clientId: string, clientName: string) => {
    if (!confirm(`Are you sure you want to disconnect ${clientName}? This will remove all synced data.`)) {
      return
    }

    setDisconnecting(clientId)
    try {
      const response = await fetch('/api/quickbooks/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Disconnected Successfully',
          description: `${clientName} has been disconnected`,
        })
        // Refresh the page
        window.location.reload()
      } else {
        toast({
          title: 'Disconnect Failed',
          description: data.error || 'Failed to disconnect client',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setDisconnecting(null)
    }
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No clients connected yet</h3>
        <p className="text-gray-600 mb-6">
          Connect your first QuickBooks client to start AI-powered categorization
        </p>
        <Link href="/dashboard/clients/connect">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Connect QuickBooks
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {clients.map((client) => (
        <div
          key={client.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:border-blue-300 transition-colors"
        >
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{client.name}</h3>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-sm text-gray-600">
                {client.transactions.length} pending transactions
              </p>
              {client.lastSyncAt && (
                <p className="text-xs text-gray-500">
                  Last synced: {new Date(client.lastSyncAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSync(client.id)}
              disabled={syncing === client.id || categorizing === client.id || disconnecting === client.id}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${syncing === client.id ? 'animate-spin' : ''}`}
              />
              {syncing === client.id ? 'Syncing...' : 'Sync'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCategorize(client.id)}
              disabled={syncing === client.id || categorizing === client.id || disconnecting === client.id || client.transactions.length === 0}
              title={client.transactions.length === 0 ? 'No transactions to categorize' : 'Categorize transactions with AI'}
            >
              <Sparkles
                className={`mr-2 h-4 w-4 ${categorizing === client.id ? 'animate-pulse' : ''}`}
              />
              {categorizing === client.id ? 'AI Thinking...' : 'AI Categorize'}
            </Button>
            <Link href={`/dashboard/clients/${client.id}/review`}>
              <Button size="sm" disabled={client.transactions.length === 0 || disconnecting === client.id}>
                Review
              </Button>
            </Link>
            <Button
              variant="default"
              size="sm"
              onClick={() => handleSyncToQB(client.id)}
              disabled={syncing === client.id || categorizing === client.id || syncingToQB === client.id || disconnecting === client.id}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Upload
                className={`mr-2 h-4 w-4 ${syncingToQB === client.id ? 'animate-bounce' : ''}`}
              />
              {syncingToQB === client.id ? 'Syncing...' : 'Sync to QB'}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDisconnect(client.id, client.name)}
              disabled={syncing === client.id || categorizing === client.id || syncingToQB === client.id || disconnecting === client.id}
            >
              <Unplug
                className={`mr-2 h-4 w-4 ${disconnecting === client.id ? 'animate-pulse' : ''}`}
              />
              {disconnecting === client.id ? 'Disconnecting...' : 'Disconnect'}
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}


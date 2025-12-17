'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, Zap, Upload, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ClientActionsProps {
  clientId: string
  showDisconnect?: boolean
}

export function ClientActions({ clientId, showDisconnect = false }: ClientActionsProps) {
  const [syncing, setSyncing] = useState(false)
  const [categorizing, setCategorizing] = useState(false)
  const [syncingToQB, setSyncingToQB] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const router = useRouter()

  const handleSync = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/transactions/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })

      if (!response.ok) {
        throw new Error('Sync failed')
      }

      const data = await response.json()
      alert(`Synced ${data.imported || 0} transactions from QuickBooks`)
      router.refresh()
    } catch (error) {
      console.error('Sync error:', error)
      alert('Failed to sync transactions')
    } finally {
      setSyncing(false)
    }
  }

  const handleCategorize = async () => {
    setCategorizing(true)
    try {
      const response = await fetch('/api/transactions/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })

      if (!response.ok) {
        throw new Error('Categorization failed')
      }

      const data = await response.json()
      alert(`Categorized ${data.categorized || 0} transactions`)
      router.refresh()
    } catch (error) {
      console.error('Categorization error:', error)
      alert('Failed to categorize transactions')
    } finally {
      setCategorizing(false)
    }
  }

  const handleSyncToQB = async () => {
    setSyncingToQB(true)
    try {
      const response = await fetch('/api/transactions/sync-to-qb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })

      if (!response.ok) {
        throw new Error('Sync to QB failed')
      }

      const data = await response.json()
      alert(`Synced ${data.synced || 0} transactions to QuickBooks`)
      router.refresh()
    } catch (error) {
      console.error('Sync to QB error:', error)
      alert('Failed to sync to QuickBooks')
    } finally {
      setSyncingToQB(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect this client? All transactions will be deleted.')) {
      return
    }

    setDisconnecting(true)
    try {
      const response = await fetch('/api/quickbooks/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })

      if (!response.ok) {
        throw new Error('Disconnect failed')
      }

      alert('Client disconnected')
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Disconnect error:', error)
      alert('Failed to disconnect client')
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        onClick={handleSync}
        disabled={syncing}
        variant="outline"
        size="sm"
      >
        <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? 'animate-spin' : ''}`} />
        {syncing ? 'Syncing...' : 'Sync'}
      </Button>

      <Button
        onClick={handleCategorize}
        disabled={categorizing}
        variant="outline"
        size="sm"
      >
        <Zap className="h-4 w-4 mr-1" />
        {categorizing ? 'Categorizing...' : 'AI Categorize'}
      </Button>

      <Button
        onClick={handleSyncToQB}
        disabled={syncingToQB}
        variant="outline"
        size="sm"
      >
        <Upload className="h-4 w-4 mr-1" />
        {syncingToQB ? 'Syncing...' : 'Sync to QB'}
      </Button>

      {showDisconnect && (
        <Button
          onClick={handleDisconnect}
          disabled={disconnecting}
          variant="outline"
          size="sm"
          className="text-red-600 border-red-300 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          {disconnecting ? 'Disconnecting...' : 'Disconnect'}
        </Button>
      )}
    </div>
  )
}


import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, RefreshCw, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'
import { ClientActions } from '@/components/clients/client-actions'

export default async function DashboardPage() {
  const user = await currentUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  // Get or create user in database
  let dbUser = await db.user.findUnique({
    where: { clerkId: user.id },
    include: {
      clients: {
        include: {
          transactions: {
            where: {
              status: 'PENDING'
            }
          }
        }
      }
    }
  })

  if (!dbUser) {
    dbUser = await db.user.create({
      data: {
        clerkId: user.id,
        email: user.emailAddresses[0].emailAddress,
        name: `${user.firstName} ${user.lastName}`.trim() || null,
      },
      include: {
        clients: {
          include: {
            transactions: {
              where: {
                status: 'PENDING'
              }
            }
          }
        }
      }
    })
  }

  const totalClients = dbUser.clients.length
  const pendingTransactions = dbUser.clients.reduce(
    (acc, client) => acc + client.transactions.length,
    0
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">QB AI Categorizer</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user.firstName || user.emailAddresses[0].emailAddress}
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalClients}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingTransactions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0 hrs</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">Overall</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with your AI categorization</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Link href="/dashboard/clients/connect">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Connect QuickBooks Client
              </Button>
            </Link>
            {totalClients > 0 && (
              <Link href="/dashboard/review">
                <Button variant="outline">
                  Review Transactions
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Clients List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Clients</CardTitle>
            <CardDescription>
              {totalClients === 0 
                ? 'Connect your first QuickBooks client to get started'
                : `Managing ${totalClients} client${totalClients !== 1 ? 's' : ''}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {totalClients === 0 ? (
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
            ) : (
              <div className="space-y-4">
                {dbUser.clients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h3 className="font-semibold">{client.name}</h3>
                      <p className="text-sm text-gray-600">
                        {client.transactions.length} pending transactions
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <ClientActions clientId={client.id} showDisconnect={true} />
                      <Link href={`/dashboard/clients/${client.id}/review`}>
                        <Button variant="outline">Review</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}


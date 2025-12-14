import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

const QB_CLIENT_ID = process.env.QB_CLIENT_ID!
const QB_CLIENT_SECRET = process.env.QB_CLIENT_SECRET!
const QB_REDIRECT_URI = process.env.QB_REDIRECT_URI!
const QB_ENVIRONMENT = process.env.QB_ENVIRONMENT || 'sandbox'

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Build QuickBooks OAuth URL manually
  const authorizationEndpoint = 'https://appcenter.intuit.com/connect/oauth2'
  const scope = 'com.intuit.quickbooks.accounting openid profile email'
  
  const params = new URLSearchParams({
    client_id: QB_CLIENT_ID,
    redirect_uri: QB_REDIRECT_URI,
    response_type: 'code',
    scope: scope,
    state: userId, // Pass userId to identify the user after OAuth
  })

  const authUrl = `${authorizationEndpoint}?${params.toString()}`

  return NextResponse.json({ authUrl })
}


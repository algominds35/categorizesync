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

  // Generate OAuth URL manually
  const scopes = ['com.intuit.quickbooks.accounting', 'openid'].join(' ')
  const authUri = `https://appcenter.intuit.com/connect/oauth2?client_id=${QB_CLIENT_ID}&redirect_uri=${encodeURIComponent(QB_REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(scopes)}&state=${userId}`

  return NextResponse.json({ authUrl: authUri })
}


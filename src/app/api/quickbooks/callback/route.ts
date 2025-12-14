import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import QuickBooks from 'node-quickbooks'

const QB_CLIENT_ID = process.env.QB_CLIENT_ID!
const QB_CLIENT_SECRET = process.env.QB_CLIENT_SECRET!
const QB_REDIRECT_URI = process.env.QB_REDIRECT_URI!
const QB_ENVIRONMENT = process.env.QB_ENVIRONMENT || 'sandbox'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const realmId = searchParams.get('realmId')
  const state = searchParams.get('state') // userId from OAuth state
  const error = searchParams.get('error')

  if (error || !code || !realmId || !state) {
    return NextResponse.redirect(
      new URL('/dashboard?error=quickbooks_connection_failed', request.url)
    )
  }

  try {
    // Exchange authorization code for tokens (OAuth 2.0)
    const tokenEndpoint = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer'
    
    const authHeader = Buffer.from(`${QB_CLIENT_ID}:${QB_CLIENT_SECRET}`).toString('base64')
    
    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: QB_REDIRECT_URI,
      }).toString(),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', errorText)
      throw new Error(`Token exchange failed: ${errorText}`)
    }

    const tokenData = await tokenResponse.json()

    // Get company info using the new access token
    const qbo = new QuickBooks(
      QB_CLIENT_ID,
      QB_CLIENT_SECRET,
      tokenData.access_token,
      false,
      realmId,
      QB_ENVIRONMENT === 'sandbox',
      false, // debug
      65, // minor version
      '2.0', // OAuth version
      tokenData.refresh_token
    )

    const companyInfo = await new Promise<any>((resolve, reject) => {
      qbo.getCompanyInfo(realmId, (err: any, response: any) => {
        if (err) reject(err)
        else resolve(response)
      })
    })

    // Find user and create client
    const user = await db.user.findUnique({
      where: { clerkId: state }
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Check if client already exists
    const existingClient = await db.client.findUnique({
      where: { qbRealmId: realmId }
    })

    if (existingClient) {
      // Update tokens
      await db.client.update({
        where: { id: existingClient.id },
        data: {
          qbAccessToken: tokenData.access_token,
          qbRefreshToken: tokenData.refresh_token,
          qbTokenExpiry: new Date(Date.now() + tokenData.expires_in * 1000),
          isActive: true,
        }
      })
    } else {
      // Create new client
      await db.client.create({
        data: {
          userId: user.id,
          name: companyInfo.CompanyName || `QB Company ${realmId}`,
          qbRealmId: realmId,
          qbAccessToken: tokenData.access_token,
          qbRefreshToken: tokenData.refresh_token,
          qbTokenExpiry: new Date(Date.now() + tokenData.expires_in * 1000),
          qbEnvironment: QB_ENVIRONMENT,
        }
      })
    }

    return NextResponse.redirect(
      new URL('/dashboard?success=client_connected', request.url)
    )
  } catch (error) {
    console.error('QuickBooks OAuth error:', error)
    return NextResponse.redirect(
      new URL('/dashboard?error=quickbooks_connection_failed', request.url)
    )
  }
}


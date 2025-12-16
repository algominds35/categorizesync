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
    console.log('[info] QB OAuth callback - exchanging code for tokens')
    
    // Manual token exchange (node-quickbooks exchangeAuthCode is broken)
    const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${QB_CLIENT_ID}:${QB_CLIENT_SECRET}`).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: QB_REDIRECT_URI
      })
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('[error] Token exchange failed:', errorText)
      throw new Error('Token exchange failed')
    }

    const tokenData = await tokenResponse.json()
    console.log('[info] Token exchange successful')

    // Get company info (non-critical)
    let companyName = `QB Company ${realmId}`
    try {
      const qbo = new QuickBooks(
        QB_CLIENT_ID,
        QB_CLIENT_SECRET,
        tokenData.access_token,
        false,
        realmId,
        QB_ENVIRONMENT === 'sandbox',
        true,
        null,
        '2.0'
      )
      
      const companyInfo = await new Promise<any>((resolve, reject) => {
        qbo.getCompanyInfo(realmId, (err: any, response: any) => {
          if (err) reject(err)
          else resolve(response)
        })
      })
      companyName = companyInfo.CompanyName || companyName
    } catch (error) {
      console.error('[error] Failed to get company info (non-critical):', error)
    }

    // Find or create user
    let user = await db.user.findUnique({
      where: { clerkId: state }
    })

    if (!user) {
      console.log('[info] User not found, creating new user')
      user = await db.user.create({
        data: {
          clerkId: state,
          email: `user-${state}@temp.com`, // Temporary, will be updated by Clerk webhook
        }
      })
    }

    // Check if client already exists
    const existingClient = await db.client.findUnique({
      where: { qbRealmId: realmId }
    })

    if (existingClient) {
      console.log('[info] Updating existing client')
      // Update tokens and environment
      await db.client.update({
        where: { id: existingClient.id },
        data: {
          qbAccessToken: tokenData.access_token,
          qbRefreshToken: tokenData.refresh_token,
          qbTokenExpiry: new Date(Date.now() + tokenData.expires_in * 1000),
          qbEnvironment: QB_ENVIRONMENT,
          isActive: true,
        }
      })
    } else {
      console.log('[info] Creating new client')
      // Create new client
      await db.client.create({
        data: {
          userId: user.id,
          name: companyName,
          qbRealmId: realmId,
          qbAccessToken: tokenData.access_token,
          qbRefreshToken: tokenData.refresh_token,
          qbTokenExpiry: new Date(Date.now() + tokenData.expires_in * 1000),
          qbEnvironment: QB_ENVIRONMENT,
        }
      })
    }

    console.log('[info] Client connected successfully')

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


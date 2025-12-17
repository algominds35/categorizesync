declare module 'node-quickbooks' {
  class QuickBooks {
    constructor(
      clientId: string,
      clientSecret: string,
      oauthToken: string,
      useProduction: boolean,
      realmId: string,
      useSandbox: boolean,
      debug: boolean,
      minorVersion: any,
      oauthVersion: string,
      redirectUri?: string
    )

    query(query: string, callback: (err: any, response: any) => void): void
    getPurchase(id: string, callback: (err: any, response: any) => void): void
    updatePurchase(purchase: any, callback: (err: any, response: any) => void): void
    refreshAccessToken(refreshToken: string, callback: (err: any, response: any) => void): void
    exchangeAuthCode(code: string, callback: (err: any, response: any) => void): void
    getCompanyInfo(realmId: string, callback: (err: any, response: any) => void): void
  }

  export = QuickBooks
}

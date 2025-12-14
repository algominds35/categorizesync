declare module 'node-quickbooks' {
  interface QuickBooksConfig {
    client_id?: string
    redirect_uri?: string
    scope?: string[]
    state?: string
  }

  interface AuthorizeUrlOptions {
    client_id: string
    redirect_uri: string
    scope: string[]
    state?: string
  }

  class QuickBooks {
    constructor(
      consumerKey: string,
      consumerSecret: string,
      oauthToken: string,
      oauthTokenSecret: boolean | string,
      realmId: string,
      useSandbox: boolean,
      debug: boolean,
      minorVersion: null | number,
      oauthVersion: string,
      redirectUri?: string
    )

    static authorizeUrl(options: AuthorizeUrlOptions): string
    static scopes: {
      Accounting: string
      OpenId: string
      Payment: string
    }

    exchangeAuthCode(code: string, callback: (err: any, response: any) => void): void
    refreshAccessToken(refreshToken: string, callback: (err: any, response: any) => void): void
    getCompanyInfo(realmId: string, callback: (err: any, response: any) => void): void
    query(query: string, callback: (err: any, response: any) => void): void
    getPurchase(id: string, callback: (err: any, response: any) => void): void
    updatePurchase(purchase: any, callback: (err: any, response: any) => void): void
    createPurchase(purchase: any, callback: (err: any, response: any) => void): void
    getAccount(id: string, callback: (err: any, response: any) => void): void
    getAccounts(callback: (err: any, response: any) => void): void
    getClass(id: string, callback: (err: any, response: any) => void): void
    getClasses(callback: (err: any, response: any) => void): void
  }

  export = QuickBooks
}













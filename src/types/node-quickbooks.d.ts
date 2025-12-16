declare module 'node-quickbooks' {
  class QuickBooks {
    constructor(
      consumerKey: string,
      consumerSecret: string,
      accessToken: string,
      tokenSecret: boolean,
      realmId: string,
      useSandbox: boolean,
      debug: boolean,
      minorVersion: null | number,
      oauthVersion: string,
      refreshToken?: string
    )

    static authorizeUrl(params: any): string
    static scopes: {
      Accounting: string
      OpenId: string
      [key: string]: string
    }

    refreshAccessToken(
      refreshToken: string,
      callback: (err: any, response: any) => void
    ): void

    getCompanyInfo(
      realmId: string,
      callback: (err: any, response: any) => void
    ): void

    query(
      query: string,
      callback: (err: any, response: any) => void
    ): void

    getPurchase(
      id: string,
      callback: (err: any, response: any) => void
    ): void

    updatePurchase(
      purchase: any,
      callback: (err: any, response: any) => void
    ): void
  }

  export = QuickBooks
}


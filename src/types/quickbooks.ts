/**
 * QuickBooks API Types
 */

export interface QBLineDetail {
  Amount: number
  DetailType: string
  AccountBasedExpenseLineDetail?: {
    AccountRef?: {
      value: string
      name: string
    }
    ClassRef?: {
      value: string
      name: string
    }
  }
  JournalEntryLineDetail?: {
    AccountRef?: {
      value: string
      name: string
    }
    ClassRef?: {
      value: string
      name: string
    }
    PostingType: 'Debit' | 'Credit'
  }
}

export interface QBEntityRef {
  value: string
  name: string
  type: 'Vendor' | 'Customer' | 'Employee'
}

export interface QBTransaction {
  Id: string
  TxnDate: string
  Line: QBLineDetail[]
  EntityRef?: QBEntityRef
  PrivateNote?: string
  TotalAmt: number
  DocNumber?: string
  CurrencyRef?: {
    value: string
    name: string
  }
  MetaData?: {
    CreateTime: string
    LastUpdatedTime: string
  }
}

export interface QBPurchase extends QBTransaction {
  PaymentType: string
  AccountRef?: {
    value: string
    name: string
  }
  PaymentMethodRef?: {
    value: string
    name: string
  }
}

export interface QBExpense extends QBTransaction {
  PaymentType: string
  AccountRef?: {
    value: string
    name: string
  }
}

export interface QBJournalEntry extends QBTransaction {
  Adjustment?: boolean
}

export interface QBAccount {
  Id: string
  Name: string
  FullyQualifiedName: string
  AccountType: string
  AccountSubType?: string
  Active: boolean
  Classification?: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense'
  SubAccount?: boolean
  ParentRef?: {
    value: string
    name: string
  }
}

export interface QBClass {
  Id: string
  Name: string
  FullyQualifiedName: string
  Active: boolean
  SubClass?: boolean
  ParentRef?: {
    value: string
    name: string
  }
}

export interface QBQueryResponse<T> {
  QueryResponse: {
    [key: string]: T | T[] | number | undefined
  }
}

export interface QBOAuthTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  x_refresh_token_expires_in: number
  token_type: 'bearer'
}


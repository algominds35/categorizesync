// Centralized configuration for the application

export const config = {
  app: {
    name: 'QB AI Categorizer',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    environment: process.env.NODE_ENV || 'development',
  },
  
  quickbooks: {
    clientId: process.env.QB_CLIENT_ID!,
    clientSecret: process.env.QB_CLIENT_SECRET!,
    redirectUri: process.env.QB_REDIRECT_URI!,
    environment: process.env.QB_ENVIRONMENT || 'sandbox',
  },
  
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4-turbo-preview',
    embeddingModel: 'text-embedding-3-small',
  },
  
  pinecone: {
    apiKey: process.env.PINECONE_API_KEY!,
    environment: process.env.PINECONE_ENVIRONMENT!,
    indexName: process.env.PINECONE_INDEX_NAME || 'qb-categorization',
  },
  
  redis: {
    url: process.env.UPSTASH_REDIS_URL!,
    token: process.env.UPSTASH_REDIS_TOKEN!,
  },
  
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY!,
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
    basePriceId: process.env.STRIPE_BASE_PRICE_ID!,
    perClientPriceId: process.env.STRIPE_PER_CLIENT_PRICE_ID!,
  },
  
  pricing: {
    basePrice: 49, // $49 base monthly
    perClientPrice: 10, // $10 per client monthly
  },
  
  ai: {
    highConfidenceThreshold: 0.9,
    mediumConfidenceThreshold: 0.75,
    similarityThreshold: 0.8, // For Pinecone vector search
  },
} as const

export type Config = typeof config


import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function getConfidenceColor(score: number): string {
  if (score >= 0.9) return 'text-green-600'
  if (score >= 0.75) return 'text-yellow-600'
  return 'text-red-600'
}

export function getConfidenceBadgeVariant(score: number): 'default' | 'secondary' | 'destructive' {
  if (score >= 0.9) return 'default'
  if (score >= 0.75) return 'secondary'
  return 'destructive'
}


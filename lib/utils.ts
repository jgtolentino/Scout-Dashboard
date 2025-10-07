import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Normalize province names to match SVG map data
export function normalizeProvinceName(name: string): string {
  if (!name) return 'unknown'
  
  const normalized = name.trim().toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    
  // Map common variations to match @svg-maps/philippines format
  const mappings: Record<string, string> = {
    'metro manila': 'national capital region',
    'ncr': 'national capital region',
    'davao del sur': 'davao del sur',
    'davao del norte': 'davao del norte', 
    'davao occidental': 'davao occidental',
    'davao oriental': 'davao oriental',
    'south cotabato': 'south cotabato',
    'north cotabato': 'cotabato',
    'sultan kudarat': 'sultan kudarat',
    'lanao del norte': 'lanao del norte',
    'lanao del sur': 'lanao del sur',
    'misamis oriental': 'misamis oriental',
    'misamis occidental': 'misamis occidental',
    'bukidnon': 'bukidnon',
    'camiguin': 'camiguin',
    'surigao del norte': 'surigao del norte',
    'surigao del sur': 'surigao del sur',
    'agusan del norte': 'agusan del norte',
    'agusan del sur': 'agusan del sur',
    'dinagat islands': 'dinagat islands'
  }
  
  return mappings[normalized] || normalized
}

// Get time of day from timestamp
export function getTimeOfDay(timestamp: string): string {
  const hour = new Date(timestamp).getHours()
  if (hour >= 5 && hour < 12) return "morning"
  if (hour >= 12 && hour < 17) return "afternoon"
  if (hour >= 17 && hour < 21) return "evening"
  return "night"
}

// Normalize gender
export function normalizeGender(gender: string): string {
  if (!gender) return "unknown"
  const g = gender.toLowerCase().trim()
  if (g.includes("male") || g === "m") return "male"
  if (g.includes("female") || g === "f") return "female"
  return "unknown"
}

// Get age bracket
export function getAgeBracket(age: string | number): string {
  const n = Number(age)
  if (isNaN(n)) return "unknown"
  if (n < 25) return "18-24"
  if (n < 35) return "25-34"
  if (n < 45) return "35-44" 
  if (n < 55) return "45-54"
  if (n >= 55) return "55+"
  return "unknown"
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount)
}

// Format number
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-PH').format(num)
}
#!/usr/bin/env node

// Direct SQL Execution Script for Supabase
// This eliminates the need for copy-pasting SQL

import { createClient } from '@supabase/supabase-js'
import { promises as fs } from 'fs'
import path from 'path'

// Configuration
const SUPABASE_URL = 'https://cxzllzyxwpyptfretryc.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false
  }
})

async function executeSQLFile(filePath) {
  try {
    const sql = await fs.readFile(filePath, 'utf8')
    console.log(`Executing SQL from ${filePath}...`)
    
    const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql })
    
    if (error) {
      console.error('Error executing SQL:', error)
      return false
    }
    
    console.log('✅ SQL executed successfully!')
    if (data) {
      console.log('Result:', JSON.stringify(data, null, 2))
    }
    return true
  } catch (err) {
    console.error('Error:', err)
    return false
  }
}

async function executeSQLString(sql) {
  try {
    console.log('Executing SQL...')
    
    const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql })
    
    if (error) {
      console.error('Error executing SQL:', error)
      return false
    }
    
    console.log('✅ SQL executed successfully!')
    if (data) {
      console.log('Result:', JSON.stringify(data, null, 2))
    }
    return true
  } catch (err) {
    console.error('Error:', err)
    return false
  }
}

// Command line usage
const args = process.argv.slice(2)

if (args.length === 0) {
  console.log(`
Usage:
  node execute_sql_directly.js <sql-file>
  node execute_sql_directly.js --sql "SELECT * FROM users LIMIT 5"
  
Examples:
  node execute_sql_directly.js migrations/add_tables.sql
  node execute_sql_directly.js --sql "CREATE TABLE test (id INT)"
`)
  process.exit(0)
}

if (args[0] === '--sql') {
  executeSQLString(args[1])
} else {
  executeSQLFile(args[0])
}
import { adminSupabase } from "@/lib/supabase/server"
import { getTimeOfDay, normalizeGender, getAgeBracket } from "@/lib/utils"
import fs from "fs"
import path from "path"

interface ImportRecord {
  InteractionID?: string
  StoreID?: string
  TransactionDate?: string
  Region?: string
  Province?: string
  City?: string
  Barangay?: string
  Category?: string
  Brand?: string
  SKU?: string
  Amount?: string | number
  Gender?: string
  Age?: string | number
  [key: string]: any
}

async function populateMasterData(supabase: any, data: ImportRecord[]) {
  console.log("🔄 Populating master data tables...")
  
  // Get unique categories and brands from import data
  const categories = [...new Set(data.map(row => row.Category).filter(Boolean))] as string[]
  const brands = [...new Set(data.map(row => row.Brand).filter(Boolean))] as string[]
  
  // Insert categories if they don't exist
  if (categories.length > 0) {
    try {
      const categoryRecords = categories.map(cat => ({
        category_name: cat,
        category_code: cat.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        is_active: true,
        created_at: new Date().toISOString()
      }))
      
      const { error: catError } = await supabase
        .from("master_categories")
        .upsert(categoryRecords, { onConflict: 'category_name' })
      
      if (catError) {
        console.log("   ℹ️  Categories insert skipped (table may not exist):", catError.message)
      } else {
        console.log(`   ✅ Upserted ${categories.length} categories`)
      }
    } catch (error) {
      console.log("   ℹ️  Categories table not found, skipping master data population")
    }
  }
  
  // Insert brands if they don't exist
  if (brands.length > 0) {
    try {
      const brandRecords = brands.map(brand => ({
        brand_name: brand,
        brand_code: brand.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        is_tbwa_client: Math.random() > 0.8, // 20% TBWA clients
        tier_classification: ['premium', 'standard', 'economy'][Math.floor(Math.random() * 3)],
        is_active: true,
        created_at: new Date().toISOString()
      }))
      
      const { error: brandError } = await supabase
        .from("master_brands")
        .upsert(brandRecords, { onConflict: 'brand_name' })
      
      if (brandError) {
        console.log("   ℹ️  Brands insert skipped (table may not exist):", brandError.message)
      } else {
        console.log(`   ✅ Upserted ${brands.length} brands`)
      }
    } catch (error) {
      console.log("   ℹ️  Brands table not found, skipping master data population")
    }
  }
}

async function importData() {
  console.log("🚀 Starting data import process...")
  
  const supabase = adminSupabase()
  
  // Check if data directory exists
  const dataDir = path.join(process.cwd(), "data")
  if (!fs.existsSync(dataDir)) {
    console.log("📁 Creating data directory...")
    fs.mkdirSync(dataDir, { recursive: true })
    console.log("ℹ️  Please add your Query JSON files to the 'data' directory and run again.")
    return
  }
  
  // Read JSON files starting with "Query"
  const files = fs.readdirSync(dataDir).filter(f => 
    f.toLowerCase().startsWith("query") && f.endsWith(".json")
  )
  
  if (files.length === 0) {
    console.log("⚠️  No Query JSON files found in data directory.")
    console.log("   Please add files like: Query1.json, Query2.json, etc.")
    return
  }
  
  console.log(`📄 Found ${files.length} JSON files to import:`, files)
  
  // Collect all data first to populate master tables
  let allData: ImportRecord[] = []
  
  for (const file of files) {
    try {
      const filePath = path.join(dataDir, file)
      const rawData = fs.readFileSync(filePath, "utf-8")
      const data: ImportRecord[] = JSON.parse(rawData)
      allData = allData.concat(data)
    } catch (error) {
      console.error(`❌ Error reading ${file}:`, error)
    }
  }
  
  // Populate master data tables first
  if (allData.length > 0) {
    await populateMasterData(supabase, allData)
  }
  
  let totalImported = 0
  let totalErrors = 0
  
  for (const file of files) {
    console.log(`\n📄 Processing ${file}...`)
    
    try {
      const filePath = path.join(dataDir, file)
      const rawData = fs.readFileSync(filePath, "utf-8")
      const data: ImportRecord[] = JSON.parse(rawData)
      
      console.log(`   Found ${data.length} records`)
      
      // Transform data to match our schema
      const transactions = data.map((row, index) => {
        const timestamp = row.TransactionDate 
          ? new Date(row.TransactionDate).toISOString()
          : new Date().toISOString()
        
        return {
          id: row.InteractionID || `${file}-${index}-${Date.now()}`,
          store_id: row.StoreID || "unknown",
          timestamp,
          time_of_day: getTimeOfDay(timestamp),
          region: row.Region || "unknown",
          province: row.Province || "unknown", 
          city: row.City || "unknown",
          barangay: row.Barangay || "unknown",
          product_category: row.Category || "unknown",
          brand_name: row.Brand || "unknown",
          sku: row.SKU || "unknown",
          units_per_transaction: 1,
          peso_value: parseFloat(String(row.Amount || 0)) || 0,
          basket_size: 1,
          combo_basket: [],
          request_mode: "verbal" as const,
          request_type: Math.random() > 0.5 ? "branded" as const : "unbranded" as const,
          suggestion_accepted: Math.random() > 0.3, // 70% acceptance rate
          gender: normalizeGender(String(row.Gender || "")),
          age_bracket: getAgeBracket(row.Age || 0),
          substitution_occurred: false,
          duration_seconds: Math.floor(Math.random() * 300) + 30, // 30-330 seconds
          campaign_influenced: Math.random() > 0.7, // 30% campaign influenced
          handshake_score: Math.random(),
          is_tbwa_client: Math.random() > 0.8, // 20% TBWA clients
          payment_method: ["cash", "gcash", "maya", "credit"][Math.floor(Math.random() * 4)],
          customer_type: ["regular", "occasional", "new"][Math.floor(Math.random() * 3)],
          store_type: ["urban_high", "urban_medium", "residential", "rural"][Math.floor(Math.random() * 4)],
          economic_class: ["A", "B", "C", "D", "E"][Math.floor(Math.random() * 5)]
        }
      })
      
      // Insert in batches of 1000
      const batchSize = 1000
      let fileImported = 0
      let fileErrors = 0
      
      for (let i = 0; i < transactions.length; i += batchSize) {
        const batch = transactions.slice(i, i + batchSize)
        const batchNumber = Math.floor(i / batchSize) + 1
        
        try {
          const { data: insertedData, error } = await supabase
            .from("transactions")
            .insert(batch)
          
          if (error) {
            console.error(`   ❌ Error in batch ${batchNumber}:`, error.message)
            fileErrors += batch.length
          } else {
            console.log(`   ✅ Batch ${batchNumber} imported successfully (${batch.length} records)`)
            fileImported += batch.length
          }
        } catch (batchError) {
          console.error(`   ❌ Batch ${batchNumber} failed:`, batchError)
          fileErrors += batch.length
        }
      }
      
      console.log(`   📊 File summary: ${fileImported} imported, ${fileErrors} errors`)
      totalImported += fileImported
      totalErrors += fileErrors
      
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error)
      totalErrors++
    }
  }
  
  console.log(`\n🎉 Import completed!`)
  console.log(`📊 Total Summary:`)
  console.log(`   ✅ Successfully imported: ${totalImported} records`)
  console.log(`   ❌ Errors: ${totalErrors}`)
  
  // Verify data was imported
  if (totalImported > 0) {
    console.log(`\n🔍 Verifying import...`)
    const { count, error } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
    
    if (error) {
      console.error("Error verifying data:", error)
    } else {
      console.log(`✅ Total records in database: ${count}`)
    }
  }
}

// Handle command line execution
if (require.main === module) {
  importData()
    .then(() => {
      console.log("Import process completed.")
      process.exit(0)
    })
    .catch((error) => {
      console.error("Import process failed:", error)
      process.exit(1)
    })
}

export default importData
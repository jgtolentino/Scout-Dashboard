# QA Class Schema Setup - Complete Drop-in Recipe

## ✅ Files Created

1. **`qa_class_schema.sql`** - Complete schema setup with roles and permissions
2. **`qa_class_keykey_setup.sh`** - Environment variable configuration guide
3. **`agents/qa_reader.yaml`** - Pulser agent with `:qa` alias
4. **`qa_class_writer_config.yaml`** - CI writer MCP configuration
5. **`test_qa_class_schema.sh`** - Connectivity testing script

## 🚀 Quick Deploy Steps

### 1. Create Schema in Supabase
```bash
# Run the SQL script in Supabase Dashboard → SQL Editor
cat qa_class_schema.sql
# Copy-paste and execute
```

### 2. Generate JWT Keys
1. Go to **Supabase Dashboard → Settings → API → JWT**
2. Create service key for `qa_class_srv` role
3. Create anon key for `qa_class_anon` role

### 3. Set Environment Variables
```bash
# Add to Doppler/KeyKey
QA_CLASS_ANON_KEY=<anon_key_from_step_2>
QA_CLASS_SERVICE_KEY=<service_key_from_step_2>
```

### 4. Update Shared MCP Server
```bash
# Add qa_class to search path
export SEARCH_PATH="qa_class,public,scout,ces"

# Or update .env file:
SEARCH_PATH=qa_class,public,scout,ces
```

### 5. Test Empty Schema
```bash
./test_qa_class_schema.sh
```

### 6. Test Pulser Alias
```bash
:qa select table=information_schema.tables columns='["table_name"]' filter='{"table_schema":"qa_class"}' limit=5
```

## 🎯 Configuration Summary

| Item | Value |
|------|-------|
| **Schema** | `qa_class` |
| **Pulser Alias** | `:qa` |
| **Writer MCP Port** | `8896` |
| **Reader Endpoint** | `http://localhost:8888` (shared) |
| **Anon Role** | `qa_class_anon` |
| **Service Role** | `qa_class_srv` |

## 🔧 Next Steps (Optional)

1. **Add tables** - Create migration files or run SQL directly
2. **Set up CI writer** - Create repo with writer MCP on port 8896
3. **Add Prisma models** - Use the schema from `qa_class_writer_config.yaml`

## 🧪 Testing Commands

```bash
# Test schema exists
:qa select table=information_schema.tables columns='["table_name"]' filter='{"table_schema":"qa_class"}' limit=10

# Test courses table (empty initially)
:qa select table=courses columns='["code","title","instructor"]' limit=5

# Add test data (if you want)
INSERT INTO qa_class.courses (code, title, instructor, start_time, end_time)
VALUES ('QA101', 'Basic Testing', 'John Doe', NOW(), NOW() + interval '2 hours');
```

The schema is now ready and can stay empty until you add tables via migrations or direct SQL!
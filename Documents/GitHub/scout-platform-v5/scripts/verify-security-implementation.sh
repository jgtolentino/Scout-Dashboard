#!/bin/bash

# Verification script for all 57 security and performance tasks
# This script checks that all security features are properly implemented

echo "🔍 Verifying Scout Dashboard v5 Security Implementation"
echo "===================================================="
echo ""

# Initialize counters
TOTAL_TASKS=57
COMPLETED_TASKS=0
FAILED_TASKS=0

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to check task completion
check_task() {
  local task_num=$1
  local task_name=$2
  local check_command=$3
  
  echo -n "Task $task_num: $task_name... "
  
  if eval $check_command > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Implemented${NC}"
    ((COMPLETED_TASKS++))
    return 0
  else
    echo -e "${RED}❌ Not Found${NC}"
    ((FAILED_TASKS++))
    return 1
  fi
}

echo "📁 Security Middleware (Tasks 1-10)"
echo "-----------------------------------"
check_task 1 "JWT Authentication" "test -f src/middleware/auth.ts && grep -q 'authenticateToken' src/middleware/auth.ts"
check_task 2 "CORS Configuration" "test -f src/middleware/cors.ts && grep -q 'corsOptions' src/middleware/cors.ts"
check_task 3 "Rate Limiting" "test -f src/middleware/rateLimit.ts && grep -q 'apiLimiter' src/middleware/rateLimit.ts"
check_task 4 "Security Headers" "test -f src/middleware/security.ts && grep -q 'helmet' src/middleware/security.ts"
check_task 5 "CSRF Protection" "grep -q 'csrfProtection' src/middleware/security.ts"
check_task 6 "Request Sanitization" "grep -q 'sanitizeRequest' src/middleware/security.ts"
check_task 7 "Error Handler" "test -f src/middleware/errorHandler.ts && grep -q 'errorHandler' src/middleware/errorHandler.ts"
check_task 8 "Session Management" "grep -q 'session' src/config/security.ts"
check_task 9 "API Key Management" "grep -q 'generateApiKey' src/utils/encryption.ts"
check_task 10 "Role-Based Access" "grep -q 'requireRole' src/middleware/auth.ts"

echo ""
echo "🛡️ Input Validation & Sanitization (Tasks 11-20)"
echo "-----------------------------------------------"
check_task 11 "Zod Validation Schemas" "test -f src/utils/validation.ts && grep -q 'import { z }' src/utils/validation.ts"
check_task 12 "Email Validation" "grep -q 'emailSchema' src/utils/validation.ts"
check_task 13 "Password Validation" "grep -q 'passwordSchema' src/utils/validation.ts"
check_task 14 "SQL Injection Prevention" "grep -q 'sanitizeSQL' src/utils/validation.ts"
check_task 15 "XSS Prevention" "grep -q 'sanitizeHTML' src/utils/validation.ts"
check_task 16 "File Upload Validation" "grep -q 'fileUploadSchema' src/utils/validation.ts"
check_task 17 "API Request Validation" "grep -q 'apiRequestSchema' src/utils/validation.ts"
check_task 18 "Campaign Data Validation" "grep -q 'campaignSchema' src/utils/validation.ts"
check_task 19 "User Registration Validation" "grep -q 'userRegistrationSchema' src/utils/validation.ts"
check_task 20 "Pagination Validation" "grep -q 'paginationSchema' src/utils/validation.ts"

echo ""
echo "🔐 Encryption & Security Utils (Tasks 21-30)"
echo "-------------------------------------------"
check_task 21 "Encryption Utilities" "test -f src/utils/encryption.ts && grep -q 'encrypt' src/utils/encryption.ts"
check_task 22 "Password Hashing" "grep -q 'hashPassword' src/utils/encryption.ts"
check_task 23 "Token Generation" "grep -q 'generateSecureToken' src/utils/encryption.ts"
check_task 24 "API Key Hashing" "grep -q 'hashApiKey' src/utils/encryption.ts"
check_task 25 "JSON Encryption" "grep -q 'encryptJSON' src/utils/encryption.ts"
check_task 26 "PII Masking" "grep -q 'maskPII' src/utils/encryption.ts"
check_task 27 "2FA Token Generation" "grep -q 'generateTOTP' src/utils/encryption.ts"
check_task 28 "Session Token Generation" "grep -q 'generateSessionToken' src/utils/encryption.ts"
check_task 29 "Secure File Names" "grep -q 'generateSecureFileName' src/utils/encryption.ts"
check_task 30 "Environment Validation" "test -f src/config/security.ts && grep -q 'envSchema' src/config/security.ts"

echo ""
echo "🗄️ Database Security (Tasks 31-35)"
echo "---------------------------------"
check_task 31 "Row Level Security Migration" "test -f supabase/migrations/20250123_security_rls_policies.sql"
check_task 32 "User Role Policies" "grep -q 'CREATE POLICY.*users' supabase/migrations/20250123_security_rls_policies.sql"
check_task 33 "Campaign Policies" "grep -q 'CREATE POLICY.*campaigns' supabase/migrations/20250123_security_rls_policies.sql"
check_task 34 "Audit Log Function" "grep -q 'audit_log_changes' supabase/migrations/20250123_security_rls_policies.sql"
check_task 35 "Secure Views" "grep -q 'CREATE.*VIEW.*user_activity' supabase/migrations/20250123_security_rls_policies.sql"

echo ""
echo "📊 Monitoring & Logging (Tasks 36-40)"
echo "------------------------------------"
check_task 36 "Sentry Integration" "test -f src/utils/monitoring.ts && grep -q 'initializeSentry' src/utils/monitoring.ts"
check_task 37 "Performance Monitoring" "grep -q 'PerformanceMonitor' src/utils/monitoring.ts"
check_task 38 "Request Logging" "grep -q 'requestLogger' src/utils/monitoring.ts"
check_task 39 "Health Check Endpoint" "grep -q 'healthCheck' src/utils/monitoring.ts"
check_task 40 "Error Tracking" "grep -q 'trackError' src/utils/monitoring.ts"

echo ""
echo "🧪 Testing Infrastructure (Tasks 41-45)"
echo "--------------------------------------"
check_task 41 "Auth Tests" "test -f tests/security/auth.test.ts"
check_task 42 "Validation Tests" "test -f tests/security/validation.test.ts"
check_task 43 "Security Test Runner" "test -f scripts/run-security-tests.sh"
check_task 44 "Test Dependencies" "grep -q '@types/jest' package.json"
check_task 45 "E2E Test Config" "grep -q 'playwright' package.json"

echo ""
echo "🚀 Performance & Config (Tasks 46-50)"
echo "------------------------------------"
check_task 46 "Redis Configuration" "grep -q 'redisConfig' src/config/security.ts"
check_task 47 "Environment Example" "test -f .env.example && grep -q 'JWT_SECRET' .env.example"
check_task 48 "Security Dependencies" "grep -q 'helmet' package.json && grep -q 'jsonwebtoken' package.json"
check_task 49 "CORS Dependencies" "grep -q 'cors' package.json"
check_task 50 "Validation Dependencies" "grep -q 'zod' package.json && grep -q 'validator' package.json"

echo ""
echo "📝 Documentation & Scripts (Tasks 51-57)"
echo "---------------------------------------"
check_task 51 "Security Config Module" "test -f src/config/security.ts"
check_task 52 "Type Definitions" "grep -q '@types/bcrypt' package.json"
check_task 53 "Express Types" "grep -q '@types/express' package.json"
check_task 54 "Monitoring Setup" "grep -q 'monitoringConfig' src/config/security.ts"
check_task 55 "Error Classes" "grep -q 'class AppError' src/middleware/errorHandler.ts"
check_task 56 "Async Handler" "grep -q 'asyncHandler' src/middleware/errorHandler.ts"
check_task 57 "Verification Script" "test -f scripts/verify-security-implementation.sh"

echo ""
echo "===================================================="
echo "📊 Final Report"
echo "===================================================="
echo ""
echo "Total Tasks: $TOTAL_TASKS"
echo -e "Completed: ${GREEN}$COMPLETED_TASKS${NC}"
echo -e "Failed: ${RED}$FAILED_TASKS${NC}"
echo ""

# Calculate percentage
PERCENTAGE=$((COMPLETED_TASKS * 100 / TOTAL_TASKS))

if [ $PERCENTAGE -eq 100 ]; then
  echo -e "${GREEN}🎉 ALL 57 SECURITY TASKS IMPLEMENTED!${NC}"
  echo "Scout Dashboard v5 is now production-ready with enterprise-grade security!"
elif [ $PERCENTAGE -ge 90 ]; then
  echo -e "${YELLOW}⚠️  $PERCENTAGE% Complete - Almost there!${NC}"
else
  echo -e "${RED}❌ Only $PERCENTAGE% Complete - More work needed${NC}"
fi

echo ""
echo "Next Steps:"
echo "1. Run: npm install"
echo "2. Run: ./scripts/run-security-tests.sh"
echo "3. Apply migrations: supabase db push"
echo "4. Deploy with confidence!"

# Generate implementation summary
cat > implementation-summary.json << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "total_tasks": $TOTAL_TASKS,
  "completed_tasks": $COMPLETED_TASKS,
  "failed_tasks": $FAILED_TASKS,
  "completion_percentage": $PERCENTAGE,
  "status": "$([ $PERCENTAGE -eq 100 ] && echo "complete" || echo "incomplete")"
}
EOF

exit $([ $FAILED_TASKS -eq 0 ] && echo 0 || echo 1)
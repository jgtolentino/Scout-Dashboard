export async function pingCacaCES(query: string, expected: string) {
  const actual = await queryClaude(query)
  return actual.includes(expected) ? '✅ PASS' : '❌ FAIL'
} 
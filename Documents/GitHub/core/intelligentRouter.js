analyzeComplexity(fullPrompt) {
  // Extract only user input from full prompt
  const userInput = fullPrompt.split('User:').pop().replace('Assistant:', '').trim();
  // Sanitize input
  const cleanInput = userInput
    .replace(/<\|im_start\|>/g, '')
    .replace(/<\|im_end\|>/g, '')
    .trim();

  const length = cleanInput.length;
  const words = cleanInput.split(/\s+/).length;
  console.log(chalk.gray(`🔍 Analyzing: "${cleanInput}" (${length} chars, ${words} words)`));

  // Check for explicit complexity indicators
  if (cleanInput.includes('--reasoning') || cleanInput.includes('complex') || cleanInput.includes('detailed')) {
    console.log(chalk.gray('  → Forced complex due to keywords'));
    return 'complex';
  }

  // Pattern matching - check in priority order: simple first
  for (const pattern of [...this.patterns.simple]) {
    if (pattern.test(cleanInput)) {
      console.log(chalk.gray(`  → Matched simple pattern: ${pattern}`));
      return 'simple';
    }
  }
  for (const pattern of [...this.patterns.coding]) {
    if (pattern.test(cleanInput)) {
      console.log(chalk.gray(`  → Matched coding pattern: ${pattern}`));
      return 'coding';
    }
  }
  for (const pattern of [...this.patterns.complex]) {
    if (pattern.test(cleanInput)) {
      console.log(chalk.gray(`  → Matched complex pattern: ${pattern}`));
      return 'complex';
    }
  }

  // Fallback
  if (length < 50 && words < 10) return 'simple';
  // ... other fallbacks
}

constructor() {
  this.patterns = {
    simple: [
      /\d+[\+\-\*\/]\d+/,                    // Math expressions: 5+5
      /^(hi|hello|hey|thanks|ok|yes|no)\b/i,     // Greetings
      /^(define|what is) \w+\b/i,               // Simple definitions
      /^(list|show|ls|pwd|cd)\b/i,              // Simple commands
      /^(time|date|weather)\b/i                 // Quick info
    ],
    coding: [
      /\b(function|def|class|import|fn|return)\b/,
      /\b(for|while|if|else|switch|case)\b/,
      /\b(var|let|const|int|string|bool)\b/,
      /(=>|->|\{|\}|\(|\)|;|,|\[|\])/ 
    ],
    complex: [
      /(explain|why|how|describe|discuss|elaborate)/i,
      /(analyze|compare|summarize|synthesize|critique)/i
    ]
  };
  this.models = {
    simple: 'tinyllama:latest',
    coding: 'codellama:7b-instruct',
    complex: 'deepseek-coder:6.7b-instruct-q4_K_M'
  };
} 
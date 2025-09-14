/**
 * Vault Secret Management Library
 * Safe runtime secret access for Edge Functions
 * 
 * Usage:
 *   import { getSecret } from "../_lib/vault.ts";
 *   const apiKey = await getSecret("OPENAI_API_KEY");
 */

export interface VaultError {
  error: string;
  key?: string;
  details?: string;
}

export class VaultSecretError extends Error {
  constructor(public vaultError: VaultError) {
    super(vaultError.error);
    this.name = 'VaultSecretError';
  }
}

/**
 * Get a secret from Supabase Vault via the secure vault_get_secret function
 * @param key Secret key (must be in vault allowlist)
 * @returns Secret value or throws VaultSecretError
 */
export async function getSecret(key: string): Promise<string> {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_KEY");
  
  if (!url || !serviceKey) {
    throw new VaultSecretError({
      error: "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables"
    });
  }

  // Sanitize key to prevent SQL injection
  const sanitizedKey = key.replace(/'/g, "''");

  try {
    const response = await fetch(`${url}/rest/v1/rpc/exec_readonly_sql`, {
      method: "POST",
      headers: {
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        "Prefer": "params=single-object"
      },
      body: JSON.stringify({
        q: `select internal.vault_get_secret('${sanitizedKey}') as secret_value`
      })
    });

    if (!response.ok) {
      throw new VaultSecretError({
        error: `Vault API request failed: ${response.status} ${response.statusText}`,
        key,
        details: await response.text()
      });
    }

    const result = await response.json();
    
    if (!result || !Array.isArray(result) || result.length === 0) {
      throw new VaultSecretError({
        error: "No data returned from vault",
        key
      });
    }

    const secretValue = result[0]?.secret_value;
    
    if (!secretValue) {
      throw new VaultSecretError({
        error: "Secret not found or is null",
        key
      });
    }

    return secretValue;

  } catch (error) {
    if (error instanceof VaultSecretError) {
      throw error;
    }
    
    throw new VaultSecretError({
      error: `Failed to fetch secret: ${error.message}`,
      key,
      details: error.toString()
    });
  }
}

/**
 * Get multiple secrets at once
 * @param keys Array of secret keys
 * @returns Object with key-value pairs
 */
export async function getSecrets(keys: string[]): Promise<Record<string, string>> {
  const results: Record<string, string> = {};
  
  // Fetch secrets in parallel
  const promises = keys.map(async (key) => {
    try {
      const value = await getSecret(key);
      return { key, value, error: null };
    } catch (error) {
      return { key, value: null, error };
    }
  });

  const settled = await Promise.all(promises);
  
  for (const result of settled) {
    if (result.error) {
      console.error(`Failed to get secret ${result.key}:`, result.error);
      continue;
    }
    results[result.key] = result.value!;
  }

  return results;
}

/**
 * Check if a secret exists without retrieving its value
 * @param key Secret key
 * @returns True if secret exists
 */
export async function hasSecret(key: string): Promise<boolean> {
  try {
    await getSecret(key);
    return true;
  } catch {
    return false;
  }
}
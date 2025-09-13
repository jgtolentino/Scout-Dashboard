import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DEFAULT_CONFIG_PATH = join(__dirname, '../config/config.yaml');
const USER_CONFIG_PATH = join(process.env.HOME || '~', '.clodrep-local', 'config.yaml');
export function loadConfig() {
    let configPath = DEFAULT_CONFIG_PATH;
    // Use user config if it exists
    if (existsSync(USER_CONFIG_PATH)) {
        configPath = USER_CONFIG_PATH;
    }
    try {
        const configFile = readFileSync(configPath, 'utf8');
        return YAML.parse(configFile);
    }
    catch (error) {
        console.error(`Failed to load config from ${configPath}:`, error);
        process.exit(1);
    }
}
export function loadPromptConfig() {
    const promptConfigPath = join(__dirname, '../config/role_core.yaml');
    try {
        const promptFile = readFileSync(promptConfigPath, 'utf8');
        return YAML.parse(promptFile);
    }
    catch (error) {
        console.error(`Failed to load prompt config:`, error);
        process.exit(1);
    }
}
//# sourceMappingURL=config.js.map
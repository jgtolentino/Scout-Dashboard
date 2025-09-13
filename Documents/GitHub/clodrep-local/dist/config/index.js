import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
const DEFAULT_CONFIG = {
    execution: {
        mode: 'hybrid',
        offline: false,
        maxConcurrentTasks: 5,
        timeout: 30000
    },
    model: {
        local: {
            provider: 'ollama',
            name: 'deepseek-coder:13b-instruct',
            temperature: 0.2,
            contextWindow: 12000
        },
        cloud: {
            provider: 'claude',
            model: 'claude-3-5-sonnet-20241022'
        },
        vision: {
            local: 'llava:7b',
            cloud: 'claude-3-5-sonnet-20241022'
        }
    },
    bridge: {
        enabled: false,
        port: 3000,
        security: {
            enableMutualTLS: true,
            tokenRotationInterval: 86400000, // 24 hours
            allowedOrigins: ['https://claude.ai', 'https://console.anthropic.com']
        },
        fallback: {
            qualityThreshold: 0.7,
            performanceThreshold: 15000, // 15 seconds
            enabled: true
        }
    },
    tools: {
        fileAccess: {
            readPaths: ['./'],
            writePaths: ['./'],
            blockedPaths: ['/etc', '/usr', '/System', '~/.ssh', '~/.aws']
        },
        execution: {
            allowedCommands: ['ls', 'cat', 'grep', 'find', 'git', 'npm', 'node', 'python'],
            blockedCommands: ['rm -rf', 'sudo', 'chmod +x', 'curl', 'wget'],
            requireConfirmation: ['mv', 'cp', 'mkdir', 'touch', 'chmod'],
            sandbox: true
        },
        network: {
            allowedDomains: ['claude.ai', 'anthropic.com', 'github.com', 'npmjs.com'],
            blockedDomains: [],
            enableWebSearch: false
        }
    },
    security: {
        confirmBeforeWrite: true,
        auditLogging: true,
        logRetentionDays: 90,
        sandboxMode: 'docker'
    },
    memory: {
        sessionHistory: 12,
        persistentMemory: true,
        enableVectorSearch: true,
        embeddingModel: 'nomic-embed-text'
    },
    logging: {
        level: 'info',
        enableFileLogging: true,
        logDirectory: '~/.clodrep-local/logs'
    }
};
export function getConfigPath() {
    return join(homedir(), '.clodrep-local', 'config.yaml');
}
export function getConfigDir() {
    return join(homedir(), '.clodrep-local');
}
export function ensureConfigDir() {
    const configDir = getConfigDir();
    if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true });
    }
    // Ensure subdirectories exist
    const subdirs = ['logs', 'memory', 'cache', 'security'];
    for (const subdir of subdirs) {
        const path = join(configDir, subdir);
        if (!existsSync(path)) {
            mkdirSync(path, { recursive: true });
        }
    }
}
export function loadConfig() {
    ensureConfigDir();
    const configPath = getConfigPath();
    if (!existsSync(configPath)) {
        // Create default config
        saveConfig(DEFAULT_CONFIG);
        return DEFAULT_CONFIG;
    }
    try {
        const content = readFileSync(configPath, 'utf-8');
        const config = parseYaml(content);
        // Merge with defaults to ensure all properties exist
        return mergeConfig(DEFAULT_CONFIG, config);
    }
    catch (error) {
        console.warn('Failed to load config, using defaults:', error);
        return DEFAULT_CONFIG;
    }
}
export function saveConfig(config) {
    ensureConfigDir();
    const configPath = getConfigPath();
    const content = stringifyYaml(config);
    writeFileSync(configPath, content, 'utf-8');
}
function mergeConfig(defaultConfig, userConfig) {
    return {
        execution: { ...defaultConfig.execution, ...userConfig.execution },
        model: {
            local: { ...defaultConfig.model.local, ...userConfig.model?.local },
            cloud: { ...defaultConfig.model.cloud, ...userConfig.model?.cloud },
            vision: { ...defaultConfig.model.vision, ...userConfig.model?.vision }
        },
        bridge: {
            ...defaultConfig.bridge,
            ...userConfig.bridge,
            security: { ...defaultConfig.bridge.security, ...userConfig.bridge?.security },
            fallback: { ...defaultConfig.bridge.fallback, ...userConfig.bridge?.fallback }
        },
        tools: {
            fileAccess: { ...defaultConfig.tools.fileAccess, ...userConfig.tools?.fileAccess },
            execution: { ...defaultConfig.tools.execution, ...userConfig.tools?.execution },
            network: { ...defaultConfig.tools.network, ...userConfig.tools?.network }
        },
        security: { ...defaultConfig.security, ...userConfig.security },
        memory: { ...defaultConfig.memory, ...userConfig.memory },
        logging: { ...defaultConfig.logging, ...userConfig.logging }
    };
}
export { DEFAULT_CONFIG };
//# sourceMappingURL=index.js.map
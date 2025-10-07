import { Command } from '@oclif/core';
export default class Bridge extends Command {
    static description: string;
    static examples: string[];
    static flags: {
        port: import("@oclif/core/lib/interfaces/parser.js").OptionFlag<number, import("@oclif/core/lib/interfaces/parser.js").CustomOptions>;
        token: import("@oclif/core/lib/interfaces/parser.js").OptionFlag<string | undefined, import("@oclif/core/lib/interfaces/parser.js").CustomOptions>;
        target: import("@oclif/core/lib/interfaces/parser.js").OptionFlag<string | undefined, import("@oclif/core/lib/interfaces/parser.js").CustomOptions>;
    };
    static args: {
        action: {
            name: string;
            description: string;
            required: boolean;
        };
    };
    run(): Promise<void>;
    private startBridge;
    private showStatus;
    private registerWithClaude;
    private generateToken;
}
//# sourceMappingURL=bridge.d.ts.map
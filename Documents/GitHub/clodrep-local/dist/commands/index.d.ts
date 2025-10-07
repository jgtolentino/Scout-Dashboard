import { Command } from '@oclif/core';
export default class ClodreptCommand extends Command {
    static description: string;
    static examples: string[];
    static flags: {
        mode: import("@oclif/core/lib/interfaces/parser.js").OptionFlag<string, import("@oclif/core/lib/interfaces/parser.js").CustomOptions>;
        model: import("@oclif/core/lib/interfaces/parser.js").OptionFlag<string, import("@oclif/core/lib/interfaces/parser.js").CustomOptions>;
        offline: import("@oclif/core/lib/interfaces/parser.js").BooleanFlag<boolean>;
        bridge: import("@oclif/core/lib/interfaces/parser.js").BooleanFlag<boolean>;
        port: import("@oclif/core/lib/interfaces/parser.js").OptionFlag<number, import("@oclif/core/lib/interfaces/parser.js").CustomOptions>;
        debug: import("@oclif/core/lib/interfaces/parser.js").BooleanFlag<boolean>;
    };
    run(): Promise<void>;
    private showBanner;
}
//# sourceMappingURL=index.d.ts.map
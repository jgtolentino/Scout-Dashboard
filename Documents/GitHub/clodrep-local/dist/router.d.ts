import type { Handler, SessionContext } from './types.js';
export declare class TaskRouter {
    private handlers;
    initialize(): Promise<void>;
    private loadHandlers;
    route(input: string, context: SessionContext): {
        handler: Handler;
        prompt: string;
    } | null;
    getAvailableHandlers(): string[];
}
//# sourceMappingURL=router.d.ts.map
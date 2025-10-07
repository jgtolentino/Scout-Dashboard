#!/usr/bin/env node
import { run } from '@oclif/core';
async function main() {
    await run();
}
main().catch((error) => {
    console.error('CLI Error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map
import { readFileSync } from 'fs';
export class NotebookReadTool {
    name = 'NotebookRead';
    description = 'Reads Jupyter notebook files';
    parameters = {
        type: 'object',
        properties: {
            notebook_path: {
                type: 'string',
                description: 'Path to the Jupyter notebook file'
            }
        },
        required: ['notebook_path']
    };
    async execute(params, context) {
        const { notebook_path } = params;
        try {
            const content = readFileSync(notebook_path, 'utf-8');
            const notebook = JSON.parse(content);
            let output = `Jupyter Notebook: ${notebook_path}\n\n`;
            for (let i = 0; i < notebook.cells.length; i++) {
                const cell = notebook.cells[i];
                output += `Cell ${i + 1} (${cell.cell_type}):\n`;
                if (cell.source) {
                    output += cell.source.join('') + '\n';
                }
                if (cell.outputs && cell.outputs.length > 0) {
                    output += 'Output:\n';
                    for (const outputItem of cell.outputs) {
                        if (outputItem.text) {
                            output += outputItem.text.join('');
                        }
                    }
                }
                output += '\n---\n\n';
            }
            return {
                success: true,
                content: output,
                metadata: {
                    notebook_path,
                    cellCount: notebook.cells.length
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to read notebook: ${error}`
            };
        }
    }
}
export class NotebookTool {
    name = 'Notebook';
    description = 'Jupyter notebook operations';
    parameters = {};
    notebookReadTool = new NotebookReadTool();
    async execute(params, context) {
        return await this.notebookReadTool.execute(params, context);
    }
}
//# sourceMappingURL=index.js.map
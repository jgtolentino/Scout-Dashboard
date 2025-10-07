import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { dirname, resolve } from 'path';
import { glob } from 'glob';
import { Tool, ToolResult, ToolContext } from '../index.js';

export class ReadTool implements Tool {
  name = 'Read';
  description = 'Reads a file from the local filesystem';
  parameters = {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'The absolute path to the file to read'
      },
      offset: {
        type: 'number',
        description: 'The line number to start reading from (optional)'
      },
      limit: {
        type: 'number',
        description: 'The number of lines to read (optional)'
      }
    },
    required: ['file_path']
  };
  
  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    const { file_path, offset = 0, limit } = params;
    
    try {
      const absolutePath = resolve(file_path);
      
      // Security check
      if (!context.security.isPathAllowed(absolutePath, 'read')) {
        return {
          success: false,
          error: `Read access denied for path: ${absolutePath}`
        };
      }
      
      if (!existsSync(absolutePath)) {
        return {
          success: false,
          error: `File not found: ${absolutePath}`
        };
      }
      
      const content = readFileSync(absolutePath, 'utf-8');
      const lines = content.split('\n');
      
      let resultLines = lines;
      if (offset > 0) {
        resultLines = lines.slice(offset);
      }
      if (limit) {
        resultLines = resultLines.slice(0, limit);
      }
      
      // Format with line numbers like cat -n
      const numberedContent = resultLines.map((line, index) => {
        const lineNumber = (offset + index + 1).toString().padStart(5, ' ');
        return `${lineNumber}\t${line}`;
      }).join('\n');
      
      return {
        success: true,
        content: numberedContent,
        metadata: {
          file_path: absolutePath,
          total_lines: lines.length,
          lines_read: resultLines.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to read file: ${error}`
      };
    }
  }
}

export class WriteTool implements Tool {
  name = 'Write';
  description = 'Writes content to a file, creating or overwriting it';
  parameters = {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'The absolute path to the file to write'
      },
      content: {
        type: 'string',
        description: 'The content to write to the file'
      }
    },
    required: ['file_path', 'content']
  };
  
  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    const { file_path, content } = params;
    
    try {
      const absolutePath = resolve(file_path);
      
      // Security check
      if (!context.security.isPathAllowed(absolutePath, 'write')) {
        return {
          success: false,
          error: `Write access denied for path: ${absolutePath}`
        };
      }
      
      // Require confirmation for writes if configured
      if (context.config.security.confirmBeforeWrite) {
        const confirmed = await context.security.requestConfirmation(
          `Write to file: ${absolutePath}?`
        );
        if (!confirmed) {
          return {
            success: false,
            error: 'Write operation cancelled by user'
          };
        }
      }
      
      // Create backup if file exists
      if (existsSync(absolutePath)) {
        await context.security.createBackup(absolutePath);
      }
      
      writeFileSync(absolutePath, content, 'utf-8');
      
      return {
        success: true,
        content: `File written successfully: ${absolutePath}`,
        metadata: {
          file_path: absolutePath,
          bytes_written: Buffer.byteLength(content, 'utf-8')
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to write file: ${error}`
      };
    }
  }
}

export class EditTool implements Tool {
  name = 'Edit';
  description = 'Performs exact string replacements in files';
  parameters = {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'The absolute path to the file to modify'
      },
      old_string: {
        type: 'string',
        description: 'The text to replace'
      },
      new_string: {
        type: 'string',
        description: 'The text to replace it with'
      },
      expected_replacements: {
        type: 'number',
        description: 'The expected number of replacements (default: 1)',
        default: 1
      }
    },
    required: ['file_path', 'old_string', 'new_string']
  };
  
  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    const { file_path, old_string, new_string, expected_replacements = 1 } = params;
    
    try {
      const absolutePath = resolve(file_path);
      
      // Security checks
      if (!context.security.isPathAllowed(absolutePath, 'write')) {
        return {
          success: false,
          error: `Write access denied for path: ${absolutePath}`
        };
      }
      
      if (!existsSync(absolutePath)) {
        return {
          success: false,
          error: `File not found: ${absolutePath}`
        };
      }
      
      if (old_string === new_string) {
        return {
          success: false,
          error: 'old_string and new_string cannot be the same'
        };
      }
      
      const content = readFileSync(absolutePath, 'utf-8');
      
      // Count occurrences
      const occurrences = (content.match(new RegExp(old_string.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'), 'g')) || []).length;
      
      if (occurrences !== expected_replacements) {
        return {
          success: false,
          error: `Expected ${expected_replacements} replacements but found ${occurrences} occurrences`
        };
      }
      
      // Create backup
      await context.security.createBackup(absolutePath);
      
      // Perform replacement
      const newContent = content.replace(new RegExp(old_string.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'), 'g'), new_string);
      
      writeFileSync(absolutePath, newContent, 'utf-8');
      
      return {
        success: true,
        content: `Successfully replaced ${occurrences} occurrence(s) in ${absolutePath}`,
        metadata: {
          file_path: absolutePath,
          replacements_made: occurrences
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to edit file: ${error}`
      };
    }
  }
}

export class GlobTool implements Tool {
  name = 'Glob';
  description = 'Fast file pattern matching tool';
  parameters = {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'The glob pattern to match files against'
      },
      path: {
        type: 'string',
        description: 'The directory to search in (optional, defaults to current directory)'
      }
    },
    required: ['pattern']
  };
  
  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    const { pattern, path = context.workingDirectory } = params;
    
    try {
      const searchPath = resolve(path);
      
      // Security check
      if (!context.security.isPathAllowed(searchPath, 'read')) {
        return {
          success: false,
          error: `Read access denied for path: ${searchPath}`
        };
      }
      
      const options = {
        cwd: searchPath,
        absolute: true,
        nodir: false
      };
      
      const matches = await glob(pattern, options);
      
      // Filter matches based on security policy
      const allowedMatches = matches.filter(match => 
        context.security.isPathAllowed(match, 'read')
      );
      
      return {
        success: true,
        content: allowedMatches,
        metadata: {
          pattern,
          search_path: searchPath,
          total_matches: matches.length,
          allowed_matches: allowedMatches.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Glob search failed: ${error}`
      };
    }
  }
}

export class GrepTool implements Tool {
  name = 'Grep';
  description = 'Fast content search tool using regular expressions';
  parameters = {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'The regular expression pattern to search for'
      },
      path: {
        type: 'string',
        description: 'The directory to search in (optional)'
      },
      include: {
        type: 'string',
        description: 'File pattern to include in search (e.g. "*.js")'
      }
    },
    required: ['pattern']
  };
  
  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    const { pattern, path = context.workingDirectory, include = '**/*' } = params;
    
    try {
      const searchPath = resolve(path);
      
      // Security check
      if (!context.security.isPathAllowed(searchPath, 'read')) {
        return {
          success: false,
          error: `Read access denied for path: ${searchPath}`
        };
      }
      
      // Find files to search
      const files = await glob(include, { cwd: searchPath, absolute: true, nodir: true });
      const allowedFiles = files.filter(file => 
        context.security.isPathAllowed(file, 'read')
      );
      
      const regex = new RegExp(pattern, 'gi');
      const matchingFiles: string[] = [];
      
      for (const file of allowedFiles) {
        try {
          const content = readFileSync(file, 'utf-8');
          if (regex.test(content)) {
            matchingFiles.push(file);
          }
        } catch (error) {
          // Skip files that can't be read
          continue;
        }
      }
      
      return {
        success: true,
        content: matchingFiles,
        metadata: {
          pattern,
          search_path: searchPath,
          files_searched: allowedFiles.length,
          matching_files: matchingFiles.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Grep search failed: ${error}`
      };
    }
  }
}

export class FileOperationsTool implements Tool {
  name = 'FileOperations';
  description = 'Composite tool for all file operations';
  parameters = {};
  
  private tools: Map<string, Tool> = new Map();
  
  constructor() {
    this.tools.set('Read', new ReadTool());
    this.tools.set('Write', new WriteTool());
    this.tools.set('Edit', new EditTool());
    this.tools.set('Glob', new GlobTool());
    this.tools.set('Grep', new GrepTool());
  }
  
  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    const { operation, ...operationParams } = params;
    
    const tool = this.tools.get(operation);
    if (!tool) {
      return {
        success: false,
        error: `Unknown file operation: ${operation}`
      };
    }
    
    return await tool.execute(operationParams, context);
  }
}
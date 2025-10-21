import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';

export const setRepoPathSchema = z.object({
  path: z.string().describe("Absolute path to the repository on the file system"),
});
export type SetRepoPathParams = z.infer<typeof setRepoPathSchema>;

export const getFilesSchema = z.object({
  path: z.string().optional().describe("Relative path within the repo (empty for root)"),
});
export type GetFilesParams = z.infer<typeof getFilesSchema>;

export const getFileContentSchema = z.object({
  file: z.string().describe("Relative path to the file within the repo"),
});
export type GetFileContentParams = z.infer<typeof getFileContentSchema>;

export const analyzeFileTypesSchema = z.object({
  file: z.string().describe("Relative path to the .ts or .js file within the repo"),
});
export type AnalyzeFileTypesParams = z.infer<typeof analyzeFileTypesSchema>;

let repoPath = '';

const server = new McpServer({
  name: 'repo-context-mcp',
  version: '0.1.0',
  port: 8082
});

server.tool(
  "setRepoPath",
  "Change the active repository path",
  setRepoPathSchema.shape,
  async ({ path }: SetRepoPathParams) => {
    repoPath = path;
    return {
      content: [
        {
          type: "text",
          text: `Repo path changed to: ${repoPath}`,
        },
      ],
    };
  }
);

server.tool(
  "getFiles",
  "List files and folders at the given path in the active repo",
  getFilesSchema.shape,
  async ({ path = '' }: GetFilesParams) => {
    if (!repoPath) throw new Error('Repo path not set. Use setRepoPath first.');
    const dir = join(repoPath, path);
    const files = readdirSync(dir).map((name) => {
      const fullPath = join(dir, name);
      return {
        name,
        isDirectory: statSync(fullPath).isDirectory()
      };
    });
    const filesList = files.map(f => `${f.isDirectory ? '[DIR] ' : '[FILE]'} ${f.name}`).join('\n');
    return {
      content: [
        {
          type: "text",
          text: filesList || "No files in this path.",
        },
      ],
    };
  }
);

server.tool(
  "getFileContent",
  "Read the content of a file in the active repo",
  getFileContentSchema.shape,
  async ({ file }: GetFileContentParams) => {
    if (!repoPath) throw new Error('Repo path not set. Use setRepoPath first.');
    const filePath = join(repoPath, file);
    const content = readFileSync(filePath, 'utf8');
    return {
      content: [
        {
          type: "text",
          text: content,
        },
      ],
    };
  }
);

server.tool(
  "getReadme",
  "Read the README.md file from the active repo",
  {},
  async () => {
    if (!repoPath) throw new Error('Repo path not set. Use setRepoPath first.');
    const readmePath = join(repoPath, 'README.md');
    try {
      const content = readFileSync(readmePath, 'utf8');
      return {
        content: [
          {
            type: "text",
            text: content,
          },
        ],
      };
    } catch {
      return {
        content: [
          {
            type: "text",
            text: "README.md not found",
          },
        ],
      };
    }
  }
);

server.tool(
  "analyzeFileTypes",
  "Analyze a file and return exported functions and the type of their parameters (if available)",
  analyzeFileTypesSchema.shape,
  async ({ file }: AnalyzeFileTypesParams) => {
    if (!repoPath) throw new Error('Repo path not set. Use setRepoPath first.');
    const filePath = join(repoPath, file);
    let content: string;
    try {
      content = readFileSync(filePath, 'utf8');
    } catch {
      return {
        content: [
          { type: 'text', text: `Could not read file: ${file}` },
        ],
      };
    }

    const exportRegex = /export\s+(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)\s*(:\s*([^{\n]+))?/g;
    const matches = [...content.matchAll(exportRegex)];
    if (matches.length === 0) {
      return {
        content: [
          { type: 'text', text: 'No exported functions found in this file.' },
        ],
      };
    }
    const result = matches.map(match => {
      const name = match[1];
      const params = match[2].trim();
      const returnType = match[4]?.trim() || 'unknown';
      return `• ${name}(${params}) : ${returnType}`;
    }).join('\n');
    return {
      content: [
        {
          type: 'text',
          text: `Exported functions found in ${file}:\n${result}`,
        },
      ],
    };
  }
);

server.tool(
  "analyzeFileTypesAdvanced",
  "Analyze a file using ts-morph and return exported functions and the type of their parameters (resolving local and imported types)",
  analyzeFileTypesSchema.shape,
  async ({ file }: AnalyzeFileTypesParams) => {
    try {
      const { Project } = await import('ts-morph');
      if (!repoPath) throw new Error('Repo path not set. Use setRepoPath first.');
      const filePath = join(repoPath, file);
      const project = new Project({
        tsConfigFilePath: join(repoPath, 'tsconfig.json'),
        skipAddingFilesFromTsConfig: false,
      });
      const sourceFile = project.getSourceFile(filePath) || project.addSourceFileAtPath(filePath);
      if (!sourceFile) {
        return {
          content: [
            { type: 'text', text: `Could not analyze file: ${file}` },
          ],
        };
      }
      const exportedFunctions = sourceFile.getFunctions().filter(fn => fn.isExported());
      if (exportedFunctions.length === 0) {
        return {
          content: [
            { type: 'text', text: 'No exported functions found in this file.' },
          ],
        };
      }
      const results: string[] = [];
      for (const fn of exportedFunctions) {
        const name = fn.getName() || '(anonymous)';
        const params = fn.getParameters().map(param => {
          const paramName = param.getName();
          const typeNode = param.getTypeNode();
          let typeText = typeNode ? typeNode.getText() : param.getType().getText();
          let typeDef = '';
          if (typeText && /[A-Z]/.test(typeText[0])) {
            let found = false;
            for (const sf of project.getSourceFiles()) {
              const typeAlias = sf.getTypeAlias(typeText);
              const iface = sf.getInterface(typeText);
              if (typeAlias) {
                typeDef = '\n' + typeAlias.getText();
                found = true;
                break;
              } else if (iface) {
                typeDef = '\n' + iface.getText();
                found = true;
                break;
              }
            }
          }
          return `${paramName}: ${typeText}${typeDef ? '\nDefinition:' + typeDef : ''}`;
        }).join(', ');
        const returnType = fn.getReturnType().getText();
        results.push(`• ${name}(${params}) : ${returnType}`);
      }
      return {
        content: [
          {
            type: 'text',
            text: `Exported functions found in ${file} (advanced analysis):\n${results.join('\n\n')}`,
          },
        ],
      };
    } catch (err) {
      let errMsg = 'Error analyzing file with ts-morph.';
      if (err && typeof err === 'object' && 'message' in err) {
        errMsg += ' ' + (err as any).message;
      } else {
        errMsg += ' ' + String(err);
      }
      return {
        content: [
          { type: 'text', text: errMsg },
        ],
      };
    }
  }
);

export const getGithubFileContentSchema = z.object({
  owner: z.string().describe("GitHub repository owner"),
  repo: z.string().describe("GitHub repository name"),
  path: z.string().describe("Path to the file in the repository"),
  ref: z.string().optional().describe("Branch, tag, or commit SHA (optional, defaults to default branch)")
});
export type GetGithubFileContentParams = z.infer<typeof getGithubFileContentSchema>;

server.tool(
  "getGithubFileContent",
  "Read the content of a file from a (private) GitHub repository using the GitHub API.",
  getGithubFileContentSchema.shape,
  async ({ owner, repo, path, ref }: GetGithubFileContentParams) => {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return {
        content: [
          { type: 'text', text: 'GITHUB_TOKEN is not set in environment variables.' },
        ],
      };
    }
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}${ref ? `?ref=${encodeURIComponent(ref)}` : ''}`;
    const headers = {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3.raw',
      'User-Agent': process.env.GITHUB_NAME || 'repo-context-mcp',
    };
    try {
      const response = await fetch(url, { headers });
      if (response.status === 404) {
        return {
          content: [
            { type: 'text', text: `File not found: ${path}` },
          ],
        };
      }
      if (response.status === 403) {
        return {
          content: [
            { type: 'text', text: 'Access denied. Check your GitHub token permissions.' },
          ],
        };
      }
      if (!response.ok) {
        return {
          content: [
            { type: 'text', text: `GitHub API error: ${response.status} ${response.statusText}` },
          ],
        };
      }
      const fileContent = await response.text();
      return {
        content: [
          {
            type: 'text',
            text: fileContent,
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          { type: 'text', text: 'Error fetching file from GitHub: ' + (String(err)) },
        ],
      };
    }
  }
);

export const getSwaggerSpecSchema = z.object({
  path: z.string().optional().describe("Relative path to the Swagger/OpenAPI file (default: looks for common names in root and docs)")
});
export type GetSwaggerSpecParams = z.infer<typeof getSwaggerSpecSchema>;

server.tool(
  "getSwaggerSpec",
  "Read the Swagger/OpenAPI specification file (swagger.json, openapi.json, openapi.yaml, etc.) from the active repo.",
  getSwaggerSpecSchema.shape,
  async ({ path }: GetSwaggerSpecParams) => {
    if (!repoPath) throw new Error('Repo path not set. Use setRepoPath first.');
    const candidates = path
      ? [path]
      : [
          'swagger.json',
          'swagger.yaml',
          'openapi.json',
          'openapi.yaml',
          'docs/swagger.json',
          'docs/swagger.yaml',
          'docs/openapi.json',
          'docs/openapi.yaml',
        ];
    let found = '';
    for (const candidate of candidates) {
      try {
        const filePath = join(repoPath, candidate);
        const content = readFileSync(filePath, 'utf8');
        found = candidate;
        return {
          content: [
            { type: 'text', text: `Swagger/OpenAPI spec found at: ${candidate}\n\n${content}` },
          ],
        };
      } catch {}
    }
    return {
      content: [
        { type: 'text', text: 'No Swagger/OpenAPI spec file found in the usual locations.' },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("repo-context-mcp MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
# READ REPO TO GET CONTEXT MCP

This repository provides an MCP (Model Context Protocol) server that allows you to explore and analyze the contents and structure of any code repository. It exposes tools to list files, read file contents, and extract type and function information from TypeScript or JavaScript files, making it easier to understand and document codebases programmatically.

## Installation & Usage

1. **Install dependencies:**
   ```sh
   npm install
   ```

2. **Build the project:**
   ```sh
   npm run build
   ```

3. **Start the server in development mode:**
   ```sh
   npm run start:dev
   ```
   Or, to run the compiled code:
   ```sh
   npm start
   ```

4. **Usage:**
   - Use the MCP tools to:
     - Set the repository path you want to analyze.
     - List files and folders.
     - Read file contents.
     - Analyze TypeScript/JavaScript files to extract exported functions and their type information.

5. **Integration:**
   - Register this MCP server as a context provider in your `mcp.json`:
     ```json
     {
       "servers": {
        "repo-context-mcp": {
        "command": "npx",
        "args": [
            "ts-node",
            "/home/pablo/Apps/read-repo-to-get-context-mcp/src/index.ts"
        ],
        "type": "stdio",
        			"env": {
				"ENVIRONMENT": "local",
				"GITHUB_TOKEN":"",
				"GITHUB_NAME": ""
  			}
        }
       }
     }
     ```

## Analyzing Private and Local Repositories

You can use this MCP server to analyze:

- **Local repositories**: Set the path to your local repo using the `setRepoPath` tool.
- **Private GitHub repositories**: Add your GitHub username and token to the environment variables in your MCP server configuration (see `mcp.json`):
  ```json
  "env": {
    "GITHUB_TOKEN": "<your-github-token>",
    "GITHUB_NAME": "<your-github-username>"
  }
  ```
  Then, use the tools to fetch and analyze files from the private repo by specifying the repo owner, name, and file path.

**Note:** For private GitHub repos, you must manually provide your GitHub credentials in the configuration. For local repos, simply pass the local path.

## Requirements

- Node.js 18+
- npm

## Notes

- You can dynamically set the repository to analyze using the `setRepoPath` tool.
- The server exposes tools for file exploration and type analysis, making it ideal for code understanding and documentation.
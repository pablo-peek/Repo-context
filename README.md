# Repo Context MCP 🚀

> **Explore and analyze any code repository—locally or remotely—directly from VS Code.**

---

## 🚀 Why Use Repo-context-mcp?

See the difference when working in VS Code **without** and **with** this tool:

|                | ❌ Without Repo-context-mcp                | ✅ With Repo-context-mcp                       |
|----------------|-------------------------------------------|------------------------------------------------|
| 🔍 Explore repo structure | Manually browse files and folders | Instantly list files and folders in any repo   |
| 📄 Read file contents     | Open files one by one             | Read any file’s content with a single command  |
| 🧑‍💻 Analyze code         | Manually inspect/export functions | Get exported functions and types automatically |
| 🔒 Private/public repos   | Need to clone and set up locally  | Analyze local or remote (even private) repos   |
| ⚡ GitHub endpoints       | Manual API calls or cloning       | Fetch files and metadata without cloning       |

---

## ✨ Features

- 📂 **List files and folders** in any repo (local or GitHub)
- 📄 **Read file contents** instantly
- 🧑‍💻 **Analyze exported functions and types** from TypeScript/JavaScript files
- 🔒 **Works with private and public repositories**
- ⚡ **No need to clone**: fetch files and metadata from GitHub endpoints

---

## 🛠️ Installation

1. **Install in VS Code**  
   > Open your workspace and run:
   ```sh
   npm install
   ```

2. **Build the project**
   ```sh
   npm run build
   ```

3. **Start the server in development mode**
   ```sh
   npm run start:dev
   ```
   Or, to run the compiled code:
   ```sh
   npm start
   ```

---

## 🚦 How It Works

With this MCP server, you can:

- Set the repository path you want to analyze (local or remote)
- List files and folders
- Read file contents
- Analyze TypeScript/JavaScript files to extract exported functions and their type information

All these tools are available directly from VS Code, making it easy to understand and document codebases while you work.

---

## 🎯 Example: Instantly Discover What an Endpoint Expects

With Repo Context MCP, you can analyze TypeScript repositories and ask very specific questions about API endpoints—like what object and types you need to send for a successful request.

**For example:**

> “What do I need to send to `POST /users/register` to create a new user?”

Repo Context MCP will analyze the source code and provide the exact JSON structure and TypeScript types required, including enums and nested objects.  
This means you’ll know precisely what to send, without wasting time guessing or searching through documentation.

**This is a huge productivity boost for developers:**
- Instantly discover endpoint payloads and types
- Avoid trial-and-error and failed requests
- Integrate faster with any backend, even private APIs

If you need concrete examples or want to see the payload for any endpoint, just ask—Repo Context MCP will extract it directly.

---

## 🔗 Integration

Register this MCP server as a context provider in your `mcp.json`:

```json
{
  "servers": {
    "repo-context-mcp": {
      "command": "npx",
      "args": [
        "ts-node",
        "/home/pablo/Apps/repo-context/src/index.ts"
      ],
      "type": "stdio",
      "env": {
        "ENVIRONMENT": "local",
        "GITHUB_TOKEN": "",
        "GITHUB_NAME": ""
      }
    }
  }
}
```

---

## 🔒 Analyzing Private and Local Repositories

- **Local repositories**: Set the path using the `setRepoPath` tool.
- **Private GitHub repositories**: Add your GitHub username and token to the environment variables in your MCP server configuration (`mcp.json`):

  ```json
  "env": {
    "GITHUB_TOKEN": "<your-github-token>",
    "GITHUB_NAME": "<your-github-username>"
  }
  ```

  Then, use the tools to fetch and analyze files from the private repo by specifying the repo owner, name, and file path.

> **Note:** For private GitHub repos, provide your GitHub credentials in the configuration. For local repos, simply pass the local path.

---

## 📦 Requirements

- Node.js 18+
- npm

---

## 💡 Notes

- Dynamically set the repository to analyze using the `setRepoPath` tool.
- The server exposes tools for file exploration and type analysis, making it ideal for code understanding and documentation.
- You can fetch files and metadata from GitHub endpoints without cloning
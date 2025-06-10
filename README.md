# Gmail MCP Server

A Model Context Protocol (MCP) server that provides comprehensive Gmail integration for AI assistants. Built with the mcp-framework, this server enables AI models to send emails, search your inbox, read messages, manage drafts, and more through Gmail's API.

## 🚀 Features

### Available Gmail Tools

- **📧 gmail.sendEmail** - Send plain-text emails
- **🔍 gmail.searchEmails** - Search emails using Gmail's powerful query syntax
- **📖 gmail.readEmail** - Read full email content by message ID
- **📝 gmail.createDraft** - Create and save draft emails
- **🗑️ gmail.deleteEmail** - Delete or move emails to trash
- **🏷️ gmail.listLabels** - List all Gmail labels and folders
- **👤 gmail.getUserProfile** - Get user's Gmail profile information

### Transport & Authentication

- **HTTP Stream Transport** - RESTful API following MCP 2025-03-26 specification
- **Token-based Authentication** - Secure authentication using Google access tokens
- **CORS Support** - Ready for web-based integrations
- **Environment Configuration** - Flexible setup via environment variables

## 📋 Prerequisites

- **Node.js** 18 or later
- **pnpm** package manager (recommended) or npm
- **Google Cloud Project** with Gmail API enabled
- **Gmail API credentials** (OAuth 2.0)

## ⚡ Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/cnye36/gmail-mcp-server.git
cd gmail-mcp-server
pnpm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```bash
# Server Configuration
PORT=8080

# Gmail API Access Token (required)
GOOGLE_ACCESS_TOKEN=your-google-access-token-here

# Optional: Google OAuth Client ID for ID token authentication
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### 3. Google API Setup

#### Option A: OAuth2 Playground (Easiest for testing)

1. Visit [Google OAuth2 Playground](https://developers.google.com/oauthplayground/)
2. Configure with your OAuth credentials (click gear icon ⚙️)
3. Select Gmail API scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send` 
   - `https://www.googleapis.com/auth/gmail.modify`
4. Complete authorization and get your access token
5. Add the token to your `.env` file

#### Option B: Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project and enable Gmail API
3. Create OAuth 2.0 credentials
4. Use your client ID in the `.env` file

### 4. Build and Start

```bash
# Build the TypeScript project
pnpm run build

# Start the server
pnpm start
```

Server will be available at: `http://localhost:8080/mcp`

## 📖 Usage

### With Claude Desktop

Add to your Claude Desktop MCP configuration:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "gmail": {
      "command": "node",
      "args": ["/absolute/path/to/gmail-mcp-server/dist/index.js"],
      "env": {
        "GOOGLE_ACCESS_TOKEN": "your-access-token-here",
        "PORT": "8080"
      }
    }
  }
}
```

### HTTP API Example

```bash
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -H "x-google-access-token: your-access-token" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "gmail.searchEmails",
      "arguments": {
        "query": "from:example@gmail.com is:unread",
        "maxResults": 10
      }
    }
  }'
```

### Gmail Search Query Examples

The `gmail.searchEmails` tool supports Gmail's full query syntax:

```
from:sender@example.com          # From specific sender
to:recipient@example.com         # To specific recipient  
subject:"meeting notes"          # Subject contains phrase
has:attachment                   # Has attachments
is:unread                       # Unread emails
is:important                    # Important emails
label:work                      # Has specific label
newer_than:7d                   # Last 7 days
older_than:1m                   # Older than 1 month
```

## 🛠️ Development

### Project Structure

```
gmail-mcp-server/
├── src/
│   ├── auth/                   # Authentication providers
│   │   ├── TokenAuthProvider.ts
│   │   └── GoogleAuthProvider.ts
│   ├── tools/                  # Gmail tool implementations
│   │   ├── SendEmail.ts
│   │   ├── SearchEmails.ts
│   │   ├── ReadEmail.ts
│   │   ├── CreateDraft.ts
│   │   ├── DeleteEmail.ts
│   │   ├── ListLabels.ts
│   │   └── GetUserProfile.ts
│   └── index.ts               # Server entry point
├── package.json
├── tsconfig.json
├── .env                       # Environment variables
└── SETUP.md                   # Detailed setup guide
```

### Available Scripts

```bash
pnpm run build    # Build TypeScript to JavaScript
pnpm run start    # Start the production server
pnpm run dev      # Start development with file watching
pnpm run test     # Build and test the server
pnpm run clean    # Remove build artifacts
```

### Adding New Tools

1. Create a new file in `src/tools/`
2. Extend the `MCPTool` class
3. Define your tool's schema and execute method
4. The framework will auto-discover your tool

Example:
```typescript
import { MCPTool } from "mcp-framework";
import { z } from "zod";

export default class MyGmailTool extends MCPTool<{param: string}> {
  name = "gmail.myTool";
  description = "Description of what this tool does";
  
  schema = {
    param: { 
      type: z.string(), 
      description: "Parameter description" 
    },
  };

  async execute({param}: {param: string}) {
    // Your Gmail API integration here
    return { result: "success" };
  }
}
```

## 🔒 Security

- **Token Management**: Access tokens are passed via headers, never logged
- **Environment Variables**: Sensitive data kept in `.env` (not in version control)
- **CORS Configuration**: Configurable origins for web integrations
- **Error Handling**: Detailed errors without exposing sensitive information

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- 📖 Detailed setup instructions: See [SETUP.md](./SETUP.md)
- 🐛 Issues: [GitHub Issues](https://github.com/cnye36/gmail-mcp-server/issues)
- 💬 Discussions: [MCP Framework Community](https://mcp-framework.com)

## 🙏 Acknowledgments

- Built with [MCP Framework](https://mcp-framework.com)
- Powered by [Google Gmail API](https://developers.google.com/gmail/api)
- Follows [Model Context Protocol](https://modelcontextprotocol.io) specification

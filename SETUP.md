# Gmail MCP Server Setup Guide

This Gmail MCP Server provides comprehensive Gmail operations through the Model Context Protocol (MCP) framework.

## Available Tools

- **gmail.sendEmail** - Send plain-text emails
- **gmail.searchEmails** - Search emails using Gmail query syntax
- **gmail.readEmail** - Read full email content by ID
- **gmail.createDraft** - Create draft emails
- **gmail.deleteEmail** - Delete or trash emails
- **gmail.listLabels** - List all Gmail labels/folders
- **gmail.getUserProfile** - Get user's Gmail profile info

## Prerequisites

1. **Node.js** (version 18 or later)
2. **pnpm** package manager
3. **Google Cloud Project** with Gmail API enabled
4. **Gmail API credentials**

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Server Configuration
PORT=8080

# Google OAuth Configuration (optional - for ID token authentication)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Gmail API Access Token (required for Gmail operations)
# You can get this from Google OAuth2 Playground or your OAuth2 flow
GOOGLE_ACCESS_TOKEN=your-google-access-token-here
```

### 3. Google API Setup

#### Option A: Using OAuth2 Playground (Easiest for testing)

1. Go to [Google OAuth2 Playground](https://developers.google.com/oauthplayground/)
2. Click the gear icon (⚙️) in the top right
3. Check "Use your own OAuth credentials"
4. Enter your OAuth 2.0 Client ID and Client Secret
5. In the left panel, find "Gmail API v1" and select the required scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.modify`
6. Click "Authorize APIs"
7. Complete the OAuth flow
8. Click "Exchange authorization code for tokens"
9. Copy the `access_token` to your `.env` file as `GOOGLE_ACCESS_TOKEN`

#### Option B: Full OAuth2 Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API
4. Create OAuth 2.0 credentials (Web application)
5. Set up your redirect URIs
6. Use the Client ID in your `.env` file as `GOOGLE_CLIENT_ID`

### 4. Build and Start

```bash
# Build the project
pnpm run build

# Start the server
pnpm start
```

The server will start on `http://localhost:8080/mcp` (or the port specified in your `.env` file).

## Authentication Methods

### Method 1: Direct Access Token
Set `GOOGLE_ACCESS_TOKEN` in your environment. This is the simplest method for testing.

### Method 2: Google ID Token Authentication
Set `GOOGLE_CLIENT_ID` in your environment. The server will authenticate requests using Google ID tokens passed in the `Authorization: Bearer <id_token>` header.

## Usage Examples

### Using with Claude Desktop

Add to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "gmail": {
      "command": "node",
      "args": ["/path/to/gmail-mcp-server/dist/index.js"],
      "env": {
        "GOOGLE_ACCESS_TOKEN": "your-access-token-here"
      }
    }
  }
}
```

### HTTP API Usage

The server exposes an HTTP endpoint at `/mcp` that follows the MCP HTTP specification.

Example tool call:
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
        "query": "from:someone@example.com",
        "maxResults": 5
      }
    }
  }'
```

## Gmail Query Syntax

For the `searchEmails` tool, you can use Gmail's powerful query syntax:

- `from:sender@example.com` - Emails from specific sender
- `to:recipient@example.com` - Emails to specific recipient
- `subject:keyword` - Emails with keyword in subject
- `has:attachment` - Emails with attachments
- `is:unread` - Unread emails
- `is:important` - Important emails
- `label:labelname` - Emails with specific label
- `newer_than:7d` - Emails newer than 7 days
- `older_than:1m` - Emails older than 1 month

## Error Handling

The server includes comprehensive error handling:
- Authentication errors return HTTP 401
- Invalid parameters return descriptive error messages
- Gmail API errors are caught and re-thrown with context

## Security Notes

- Keep your access tokens secure and don't commit them to version control
- Access tokens expire - you'll need to refresh them periodically
- Consider using environment variable management tools for production
- The server supports CORS for web-based clients but be careful with token exposure

## Troubleshooting

1. **"Missing Gmail access token" error**: Ensure `GOOGLE_ACCESS_TOKEN` is set in your environment
2. **Authentication failures**: Check that your Google Cloud project has Gmail API enabled
3. **Permission errors**: Ensure your OAuth scopes include the necessary Gmail permissions
4. **Network errors**: Check your internet connection and firewall settings

## Development

To modify or extend the server:

1. Edit tools in `src/tools/`
2. Modify authentication in `src/auth/`
3. Update server configuration in `src/index.ts`
4. Build with `pnpm run build`
5. Test with `pnpm start` 
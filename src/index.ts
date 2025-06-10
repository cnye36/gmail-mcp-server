import "dotenv/config";
import { MCPServer } from "mcp-framework";
import { TokenAuthProvider } from "./auth/TokenAuthProvider.js";

const server = new MCPServer({
  name: "Gmail MCP Server",
  version: "1.0.0",
  transport: {
    type: "http-stream",
    options: {
      port: process.env.PORT ? parseInt(process.env.PORT) : 8080,
      cors: {
        allowOrigin: "*",
        allowMethods: "GET, POST, OPTIONS",
        allowHeaders: "Content-Type, Authorization, x-google-access-token",
      },
      auth: {
        provider: new TokenAuthProvider(),
        endpoints: {
          messages: true, // Require auth for tool calls
        },
      },
    },
  },
});

// Start the server
server
  .start()
  .then(() => {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 8080;
    console.log(`🚀 Gmail MCP Server started on http://localhost:${port}/mcp`);
    console.log(`📧 Available tools:`);
    console.log(`   - gmail.sendEmail - Send emails`);
    console.log(
      `   - gmail.searchEmails - Search emails with Gmail query syntax`
    );
    console.log(`   - gmail.readEmail - Read full email content`);
    console.log(`   - gmail.createDraft - Create draft emails`);
    console.log(`   - gmail.deleteEmail - Delete/trash emails`);
    console.log(`   - gmail.listLabels - List Gmail labels`);
    console.log(`   - gmail.getUserProfile - Get user profile`);
    console.log(
      `🔐 Authentication: Token-based (x-google-access-token header required)`
    );
    console.log(`📚 Ready to receive requests with Google access tokens!`);
  })
  .catch((error) => {
    console.error("Failed to start Gmail MCP Server:", error);
    process.exit(1);
  });

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nShutting down Gmail MCP Server...");
  await server.stop();
  process.exit(0);
});

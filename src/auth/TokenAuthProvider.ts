import { AuthProvider, AuthResult } from "mcp-framework";
import { IncomingMessage } from "node:http";

/**
 * Simple token-based authentication that expects a Google access token
 * in the `x-google-access-token` header.
 *
 * This is designed for use cases where the OAuth flow happens in a parent
 * application that then passes the access token to this MCP server.
 */
export class TokenAuthProvider implements AuthProvider {
  async authenticate(req: IncomingMessage): Promise<boolean | AuthResult> {
    // Look for the access token in headers
    const accessToken = req.headers["x-google-access-token"];

    if (!accessToken || Array.isArray(accessToken)) {
      return false;
    }

    // For a more robust implementation, you could validate the token
    // with Google's tokeninfo endpoint, but for now we'll trust it
    return {
      data: {
        accessToken,
        source: "header",
      },
    };
  }

  getAuthError() {
    return {
      status: 401,
      message: "Missing or invalid x-google-access-token header",
    };
  }
}

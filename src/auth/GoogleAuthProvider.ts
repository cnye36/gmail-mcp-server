// GoogleAuthProvider.ts -----------------------------------------------
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { AuthProvider, AuthResult } from "mcp-framework"; // <- ✔
import { IncomingMessage } from "node:http";

/**
 * Authenticates requests that carry a Google *ID token* in the
 * `Authorization: Bearer <jwt>` header.
 *
 * ── How it works ─────────────────────────────────────────────────────
 * 1. Verify the JWT signature & audience with google-auth-library.
 * 2. Return `true` (or an AuthResult) so MCP accepts the request.
 * 3. If verification fails, return `false`; MCP will call `getAuthError()`.
 */
export class GoogleAuthProvider implements AuthProvider {
  private verifier: OAuth2Client;

  constructor(private readonly googleClientId: string) {
    this.verifier = new OAuth2Client(googleClientId);
  }

  async authenticate(req: IncomingMessage): Promise<boolean | AuthResult> {
    // 1) Extract & sanitise the ID token
    const raw = req.headers.authorization;
    if (!raw || Array.isArray(raw)) return false;
    const idToken = raw.replace(/^Bearer\s+/i, "");

    // 2) Verify with Google
    let payload: TokenPayload | undefined;
    try {
      const ticket = await this.verifier.verifyIdToken({
        idToken,
        audience: this.googleClientId,
      });
      payload = ticket.getPayload();
    } catch {
      return false; // signature, exp, aud, or iss check failed
    }

    // 3) (Optional) hand extra info to downstream code
    return {
      // Anything you put in `data` is exposed on the auth context
      // when a tool executes.
      data: {
        sub: payload?.sub,
        email: payload?.email,
        accessToken: req.headers["x-google-access-token"] as string,
      },
    };
  }

  getAuthError() {
    return { status: 401, message: "Invalid or missing Google ID token" };
  }
}

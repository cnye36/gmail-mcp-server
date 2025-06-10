// tools/SendEmail.ts ---------------------------------------------------
import { google } from "googleapis";
import { MCPTool } from "mcp-framework";
import { z } from "zod";

export default class SendEmail extends MCPTool<{
  to: string;
  subj: string;
  body: string;
}> {
  name = "gmail.sendEmail";
  description = "Send plain-text mail via Gmail";
  schema = {
    to: { type: z.string().email(), description: "Recipient" },
    subj: { type: z.string(), description: "Subject line" },
    body: { type: z.string(), description: "Email body" },
  };

  async execute({
    to,
    subj,
    body,
  }: {
    to: string;
    subj: string;
    body: string;
  }) {
    // Get access token from headers or auth context
    const accessToken = this.getAccessToken();
    if (!accessToken) {
      throw new Error("Missing Gmail access token");
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const raw = Buffer.from(
      `To: ${to}\r\nSubject: ${subj}\r\n\r\n${body}`
    ).toString("base64url");

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw },
    });

    return {
      status: "sent",
      messageId: response.data.id,
    };
  }

  private getAccessToken(): string | undefined {
    // This will be set by the auth provider or passed via headers
    // For now, we'll expect it to be passed via x-google-access-token header
    return process.env.GOOGLE_ACCESS_TOKEN;
  }
}

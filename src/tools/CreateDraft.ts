import { google } from "googleapis";
import { MCPTool } from "mcp-framework";
import { z } from "zod";

export default class CreateDraft extends MCPTool<{
  to?: string;
  subject?: string;
  body?: string;
  cc?: string;
  bcc?: string;
}> {
  name = "gmail.createDraft";
  description = "Create a draft email in Gmail";
  schema = {
    to: { type: z.string().optional(), description: "Recipient email address" },
    subject: { type: z.string().optional(), description: "Email subject" },
    body: { type: z.string().optional(), description: "Email body content" },
    cc: {
      type: z.string().optional(),
      description: "CC recipients (comma-separated)",
    },
    bcc: {
      type: z.string().optional(),
      description: "BCC recipients (comma-separated)",
    },
  };

  async execute({
    to = "",
    subject = "",
    body = "",
    cc = "",
    bcc = "",
  }: {
    to?: string;
    subject?: string;
    body?: string;
    cc?: string;
    bcc?: string;
  }) {
    const accessToken = this.getAccessToken();
    if (!accessToken) {
      throw new Error("Missing Gmail access token");
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    try {
      // Build email headers
      let emailStr = "";
      if (to) emailStr += `To: ${to}\r\n`;
      if (cc) emailStr += `Cc: ${cc}\r\n`;
      if (bcc) emailStr += `Bcc: ${bcc}\r\n`;
      emailStr += `Content-Type: text/plain; charset="UTF-8"\r\n`;
      emailStr += `MIME-Version: 1.0\r\n`;
      if (subject) emailStr += `Subject: ${subject}\r\n`;
      emailStr += `\r\n${body}`;

      const rawEmail = Buffer.from(emailStr)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

      const response = await gmail.users.drafts.create({
        userId: "me",
        requestBody: {
          message: {
            raw: rawEmail,
          },
        },
      });

      return {
        status: "draft_created",
        draftId: response.data.id,
        messageId: response.data.message?.id,
        to,
        subject,
        preview: body.slice(0, 100) + (body.length > 100 ? "..." : ""),
      };
    } catch (error) {
      throw new Error(
        `Failed to create draft: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private getAccessToken(): string | undefined {
    return process.env.GOOGLE_ACCESS_TOKEN;
  }
}

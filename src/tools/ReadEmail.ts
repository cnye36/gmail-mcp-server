import { google } from "googleapis";
import { MCPTool } from "mcp-framework";
import { z } from "zod";

export default class ReadEmail extends MCPTool<{
  messageId: string;
}> {
  name = "gmail.readEmail";
  description = "Read the full content of a specific email by ID";
  schema = {
    messageId: {
      type: z.string(),
      description: "The ID of the email message to read",
    },
  };

  async execute({ messageId }: { messageId: string }) {
    const accessToken = this.getAccessToken();
    if (!accessToken) {
      throw new Error("Missing Gmail access token");
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    try {
      const response = await gmail.users.messages.get({
        userId: "me",
        id: messageId,
        format: "full",
      });

      const message = response.data;
      const headers = message.payload?.headers || [];

      const subject = headers.find((h) => h.name === "Subject")?.value || "";
      const from = headers.find((h) => h.name === "From")?.value || "";
      const to = headers.find((h) => h.name === "To")?.value || "";
      const date = headers.find((h) => h.name === "Date")?.value || "";
      const cc = headers.find((h) => h.name === "Cc")?.value || "";

      // Extract body content
      let body = "";
      let htmlBody = "";

      const extractBody = (part: any) => {
        if (part.mimeType === "text/plain" && part.body?.data) {
          body = Buffer.from(part.body.data, "base64").toString("utf-8");
        } else if (part.mimeType === "text/html" && part.body?.data) {
          htmlBody = Buffer.from(part.body.data, "base64").toString("utf-8");
        } else if (part.parts) {
          part.parts.forEach(extractBody);
        }
      };

      if (message.payload?.parts) {
        message.payload.parts.forEach(extractBody);
      } else if (message.payload?.body?.data) {
        // Single part message
        if (message.payload.mimeType === "text/plain") {
          body = Buffer.from(message.payload.body.data, "base64").toString(
            "utf-8"
          );
        } else if (message.payload.mimeType === "text/html") {
          htmlBody = Buffer.from(message.payload.body.data, "base64").toString(
            "utf-8"
          );
        }
      }

      return {
        id: messageId,
        threadId: message.threadId,
        subject,
        from,
        to,
        cc,
        date,
        snippet: message.snippet || "",
        body: body || htmlBody, // Prefer plain text, fallback to HTML
        hasHtml: !!htmlBody,
        labelIds: message.labelIds || [],
      };
    } catch (error) {
      throw new Error(
        `Failed to read email: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private getAccessToken(): string | undefined {
    return process.env.GOOGLE_ACCESS_TOKEN;
  }
}

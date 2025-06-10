import { google } from "googleapis";
import { MCPTool } from "mcp-framework";
import { z } from "zod";

export default class SearchEmails extends MCPTool<{
  query: string;
  maxResults?: number;
}> {
  name = "gmail.searchEmails";
  description = "Search emails in Gmail using query syntax";
  schema = {
    query: {
      type: z.string(),
      description:
        "Gmail search query (e.g., 'from:someone@example.com', 'subject:urgent')",
    },
    maxResults: {
      type: z.number().optional().default(10),
      description: "Maximum number of results to return",
    },
  };

  async execute({
    query,
    maxResults = 10,
  }: {
    query: string;
    maxResults?: number;
  }) {
    const accessToken = this.getAccessToken();
    if (!accessToken) {
      throw new Error("Missing Gmail access token");
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    try {
      const response = await gmail.users.messages.list({
        userId: "me",
        q: query,
        maxResults,
      });

      const messages = response.data.messages || [];
      const results = [];

      // Get basic info for each message
      for (const message of messages.slice(0, Math.min(maxResults, 20))) {
        try {
          const details = await gmail.users.messages.get({
            userId: "me",
            id: message.id!,
            format: "metadata",
            metadataHeaders: ["From", "Subject", "Date"],
          });

          const headers = details.data.payload?.headers || [];
          const from = headers.find((h) => h.name === "From")?.value || "";
          const subject =
            headers.find((h) => h.name === "Subject")?.value || "";
          const date = headers.find((h) => h.name === "Date")?.value || "";

          results.push({
            id: message.id,
            threadId: message.threadId,
            snippet: details.data.snippet || "",
            from,
            subject,
            date,
          });
        } catch (error) {
          console.error(
            `Error getting details for message ${message.id}:`,
            error
          );
        }
      }

      return {
        query,
        totalResults: messages.length,
        messages: results,
      };
    } catch (error) {
      throw new Error(
        `Failed to search emails: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private getAccessToken(): string | undefined {
    return process.env.GOOGLE_ACCESS_TOKEN;
  }
}

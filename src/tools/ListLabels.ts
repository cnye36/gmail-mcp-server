import { google } from "googleapis";
import { MCPTool } from "mcp-framework";
import { z } from "zod";

export default class ListLabels extends MCPTool<{}> {
  name = "gmail.listLabels";
  description = "List all Gmail labels (folders) available to the user";
  schema = {};

  async execute() {
    const accessToken = this.getAccessToken();
    if (!accessToken) {
      throw new Error("Missing Gmail access token");
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    try {
      const response = await gmail.users.labels.list({
        userId: "me",
      });

      const labels = response.data.labels || [];

      return {
        totalLabels: labels.length,
        labels: labels.map((label) => ({
          id: label.id,
          name: label.name,
          type: label.type,
          messagesTotal: label.messagesTotal,
          messagesUnread: label.messagesUnread,
          threadsTotal: label.threadsTotal,
          threadsUnread: label.threadsUnread,
        })),
      };
    } catch (error) {
      throw new Error(
        `Failed to list labels: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private getAccessToken(): string | undefined {
    return process.env.GOOGLE_ACCESS_TOKEN;
  }
}

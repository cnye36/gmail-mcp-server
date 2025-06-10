import { google } from "googleapis";
import { MCPTool } from "mcp-framework";
import { z } from "zod";

export default class GetUserProfile extends MCPTool<{}> {
  name = "gmail.getUserProfile";
  description = "Get the Gmail user's profile information";
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
      const response = await gmail.users.getProfile({
        userId: "me",
      });

      const profile = response.data;

      return {
        emailAddress: profile.emailAddress,
        messagesTotal: profile.messagesTotal,
        threadsTotal: profile.threadsTotal,
        historyId: profile.historyId,
      };
    } catch (error) {
      throw new Error(
        `Failed to get user profile: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private getAccessToken(): string | undefined {
    return process.env.GOOGLE_ACCESS_TOKEN;
  }
}

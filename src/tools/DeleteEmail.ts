import { google } from "googleapis";
import { MCPTool } from "mcp-framework";
import { z } from "zod";

export default class DeleteEmail extends MCPTool<{
  messageId: string;
  permanent?: boolean;
}> {
  name = "gmail.deleteEmail";
  description = "Delete or trash an email message";
  schema = {
    messageId: {
      type: z.string(),
      description: "The ID of the email message to delete",
    },
    permanent: {
      type: z.boolean().optional().default(false),
      description:
        "If true, permanently delete the email. If false, move to trash.",
    },
  };

  async execute({
    messageId,
    permanent = false,
  }: {
    messageId: string;
    permanent?: boolean;
  }) {
    const accessToken = this.getAccessToken();
    if (!accessToken) {
      throw new Error("Missing Gmail access token");
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    try {
      if (permanent) {
        // Permanently delete the message
        await gmail.users.messages.delete({
          userId: "me",
          id: messageId,
        });

        return {
          status: "permanently_deleted",
          messageId,
          action:
            "The email has been permanently deleted and cannot be recovered.",
        };
      } else {
        // Move to trash
        await gmail.users.messages.trash({
          userId: "me",
          id: messageId,
        });

        return {
          status: "moved_to_trash",
          messageId,
          action:
            "The email has been moved to trash and can be restored if needed.",
        };
      }
    } catch (error) {
      throw new Error(
        `Failed to delete email: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private getAccessToken(): string | undefined {
    return process.env.GOOGLE_ACCESS_TOKEN;
  }
}

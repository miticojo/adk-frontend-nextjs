import { ChatSession } from "./session-storage";

export class ExportUtils {
  static exportToJSON(session: ChatSession): void {
    const data = {
      session: {
        id: session.id,
        title: session.title,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
      },
      messages: session.messages,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-${session.title.toLowerCase().replace(/\s+/g, "-")}-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static exportToMarkdown(session: ChatSession): void {
    let markdown = `# ${session.title}\n\n`;
    markdown += `**Created:** ${session.createdAt.toLocaleString()}\n`;
    markdown += `**Updated:** ${session.updatedAt.toLocaleString()}\n\n`;
    markdown += `---\n\n`;

    session.messages.forEach((message) => {
      const role = message.role === "user" ? "**You**" : "**Assistant**";
      const timestamp = new Date().toLocaleTimeString();

      markdown += `### ${role} (${timestamp})\n\n`;
      markdown += `${message.content}\n\n`;
      markdown += `---\n\n`;
    });

    const blob = new Blob([markdown], {
      type: "text/markdown",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-${session.title.toLowerCase().replace(/\s+/g, "-")}-${
      new Date().toISOString().split("T")[0]
    }.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static exportToText(session: ChatSession): void {
    let text = `Chat: ${session.title}\n`;
    text += `Created: ${session.createdAt.toLocaleString()}\n`;
    text += `Updated: ${session.updatedAt.toLocaleString()}\n`;
    text += "=".repeat(50) + "\n\n";

    session.messages.forEach((message) => {
      const role = message.role === "user" ? "You" : "Assistant";
      text += `[${role}]: ${message.content}\n\n`;
    });

    const blob = new Blob([text], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-${session.title.toLowerCase().replace(/\s+/g, "-")}-${
      new Date().toISOString().split("T")[0]
    }.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static copyToClipboard(session: ChatSession): Promise<void> {
    let text = `Chat: ${session.title}\n`;
    text += `Created: ${session.createdAt.toLocaleString()}\n\n`;

    session.messages.forEach((message) => {
      const role = message.role === "user" ? "You" : "Assistant";
      text += `${role}: ${message.content}\n\n`;
    });

    return navigator.clipboard.writeText(text);
  }
}

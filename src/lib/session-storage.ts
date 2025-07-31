import { Message } from "./api";

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export class SessionStorage {
  private static readonly STORAGE_KEY = "chat_sessions";

  static getSessions(): ChatSession[] {
    if (typeof window === "undefined") return [];

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const sessions = JSON.parse(stored);
      return sessions
        .map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt),
        }))
        .filter((session: ChatSession) => session.messages.length > 0); // Only return sessions with messages
    } catch (error) {
      console.error("Error loading sessions:", error);
      return [];
    }
  }

  static saveSession(session: ChatSession): void {
    if (typeof window === "undefined") return;

    try {
      const sessions = this.getSessions();
      const existingIndex = sessions.findIndex((s) => s.id === session.id);

      if (existingIndex >= 0) {
        sessions[existingIndex] = session;
      } else {
        sessions.unshift(session);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error("Error saving session:", error);
    }
  }

  static getSession(id: string): ChatSession | null {
    const sessions = this.getSessions();
    return sessions.find((s) => s.id === id) || null;
  }

  static deleteSession(id: string): void {
    if (typeof window === "undefined") return;

    try {
      const sessions = this.getSessions().filter((s) => s.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  }

  static generateTitle(messages: Message[]): string {
    if (messages.length === 0) return "New Chat";

    const firstUserMessage = messages.find((m) => m.role === "user");
    if (!firstUserMessage) return "New Chat";

    const content = firstUserMessage.content;
    return content.length > 50 ? content.substring(0, 50) + "..." : content;
  }
}

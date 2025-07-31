import { v4 as uuidv4 } from "uuid";

const API_BASE_URL = "/api/chat";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export const createSession = async (): Promise<{
  userId: string;
  sessionId: string;
}> => {
  const response = await fetch(API_BASE_URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.json();
};

export const runAgent = async (
  userId: string,
  sessionId: string,
  message: string,
  history: Message[]
): Promise<Message> => {
  const requestBody = {
    userId: userId,
    sessionId: sessionId,
    message: message,
    history: history,
  };

  if (process.env.NODE_ENV === "development") {
    console.log("Request to agent proxy:", requestBody);
  }

  const response = await fetch(API_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error from backend: ${errorText}`);
  }

  return response.json();
};

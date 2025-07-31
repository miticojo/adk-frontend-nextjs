import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

const API_BASE_URL = process.env.ADK_SERVER_ENDPOINT || "http://127.0.0.1:8000";
const APP_NAME = process.env.ADK_APP_NAME || "ce_agent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, sessionId, message, history } = body;

    if (!userId || !sessionId || !message) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const requestBody = {
      app_name: APP_NAME,
      user_id: userId,
      session_id: sessionId,
      history: history || [],
      new_message: {
        role: "user",
        parts: [{ text: message }],
      },
    };

    if (process.env.NODE_ENV === "development") {
      console.log(
        ">>> Request TO ADK Backend:",
        JSON.stringify(requestBody, null, 2)
      );
    }

    const pythonBackendResponse = await fetch(`${API_BASE_URL}/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!pythonBackendResponse.ok) {
      const errorText = await pythonBackendResponse.text();
      console.error("Backend error:", errorText);
      return new NextResponse(errorText, {
        status: pythonBackendResponse.status,
      });
    }

    const events = await pythonBackendResponse.json();

    if (process.env.NODE_ENV === "development") {
      console.log(
        "<<< Response FROM ADK Backend:",
        JSON.stringify(events, null, 2)
      );
    }

    if (!Array.isArray(events)) {
      console.error("Backend did not return an array of events:", events);
      return new NextResponse("Invalid response from backend", { status: 500 });
    }

    const assistantMessages = events
      .filter(
        (e: any) => e.author === "ce_agent" && e.content?.parts?.[0]?.text
      )
      .map((e: any) => e.content.parts[0].text)
      .join("");

    if (assistantMessages) {
      if (process.env.NODE_ENV === "development") {
        console.log("Full assistant message:", assistantMessages);
      }
      return NextResponse.json({ response: assistantMessages });
    } else {
      return NextResponse.json({ response: "..." });
    }
  } catch (error) {
    console.error("Error in chat API route:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = uuidv4();
    const sessionId = uuidv4();

    await fetch(
      `${API_BASE_URL}/apps/${APP_NAME}/users/${userId}/sessions/${sessionId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ state: {} }),
      }
    );

    return NextResponse.json({ userId, sessionId });
  } catch (error) {
    console.error("Error creating session:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

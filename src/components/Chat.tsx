"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SessionStorage } from "@/lib/session-storage";
import { ExportUtils } from "@/lib/export-utils";
import { SessionSidebar } from "@/components/session-sidebar";
import { MessageItem } from "@/components/message-item";
import { Message, createSession } from "@/lib/api";
import {
  Send,
  Plus,
  Download,
  Menu,
  Sparkles,
  MessageSquare,
  Bot,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface SuggestedQuestion {
  title: string;
  question: string;
  icon: string;
}

const getIcon = (name: string) => {
  const Icon = (LucideIcons as any)[name];
  if (Icon) {
    return <Icon className="w-4 h-4 text-blue-500" />;
  }
  return null;
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [currentSessionTitle, setCurrentSessionTitle] = useState("New Chat");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<
    SuggestedQuestion[]
  >([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize first session on mount
  useEffect(() => {
    const initializeSession = async () => {
      if (!sessionId) {
        await createNewSession();
      }
    };
    initializeSession();

    const fetchSuggestedQuestions = async () => {
      try {
        const response = await fetch("/suggested-questions.json");
        const data = await response.json();
        setSuggestedQuestions(data);
      } catch (error) {
        console.error("Error fetching suggested questions:", error);
      }
    };
    fetchSuggestedQuestions();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input on mount and when sidebar closes
  useEffect(() => {
    if (!sidebarOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [sidebarOpen]);

  const loadSession = async (sessionId: string) => {
    const session = SessionStorage.getSession(sessionId);
    if (session) {
      setSessionId(sessionId);
      setMessages(session.messages);
      setCurrentSessionTitle(session.title);

      // Extract userId from session id or create a new backend session if needed
      let userId = session.id.split("-")[0] || "";

      // For old sessions that don't have backend sessions, try to extract userId
      // or create a new backend session
      if (!userId || userId === "session") {
        try {
          // Try to create a backend session to ensure it exists
          const { userId: newUserId, sessionId: newSessionId } =
            await createSession();

          // Update the session with the new backend IDs
          const updatedSession = {
            ...session,
            id: newSessionId,
          };
          SessionStorage.saveSession(updatedSession);

          setSessionId(newSessionId);
          setUserId(newUserId);
        } catch (error) {
          console.error(
            "Error creating backend session for existing session:",
            error
          );
          // Fallback to using existing session data
          setUserId(userId || `user-${Date.now()}`);
        }
      } else {
        setUserId(userId);
      }

      setSidebarOpen(false); // Close sidebar on mobile after selection
    }
  };

  const createNewSession = async () => {
    try {
      // Create backend session first
      const { userId: newUserId, sessionId: newSessionId } =
        await createSession();

      // Don't save to SessionStorage yet - wait until first message
      setSessionId(newSessionId);
      setUserId(newUserId);
      setMessages([]);
      setCurrentSessionTitle("New Chat");
      setSidebarOpen(false); // Close sidebar after creating new session

      // Focus input after creating new session
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);

      return newSessionId;
    } catch (error) {
      console.error("Error creating new session:", error);
      // Fallback to local-only session if backend fails
      const newUserId = `user-${Date.now()}`;
      const newSessionId = `session-${Date.now()}`;

      // Don't save to SessionStorage yet - wait until first message
      setSessionId(newSessionId);
      setUserId(newUserId);
      setMessages([]);
      setCurrentSessionTitle("New Chat");
      setSidebarOpen(false);

      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);

      return newSessionId;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !sessionId || !userId || isSending) return;

    const currentInput = input;
    setInput("");
    setIsSending(true);

    const userMessage: Message = {
      role: "user",
      content: currentInput,
    };

    const historyWithUserMessage = [...messages, userMessage];
    setMessages(historyWithUserMessage);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          sessionId,
          message: currentInput,
          messages: historyWithUserMessage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
      };

      const updatedMessages = [...historyWithUserMessage, assistantMessage];
      setMessages(updatedMessages);

      // Save session
      const session = SessionStorage.getSession(sessionId);
      if (session) {
        const updatedSession = {
          ...session,
          messages: updatedMessages,
          title: SessionStorage.generateTitle(updatedMessages),
          updatedAt: new Date(),
        };
        SessionStorage.saveSession(updatedSession);
        setCurrentSessionTitle(updatedSession.title);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Show error message
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      };
      setMessages([...historyWithUserMessage, errorMessage]);
    } finally {
      setIsSending(false);
      // Refocus input after sending
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleExport = () => {
    if (sessionId) {
      const session = SessionStorage.getSession(sessionId);
      if (session) {
        ExportUtils.exportToJSON(session);
      }
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <SessionSidebar
        currentSessionId={sessionId}
        onSessionSelect={async (session) =>
          session && (await loadSession(session.id))
        }
        onNewSession={createNewSession}
        className={`${sidebarOpen ? "block" : "hidden"} md:block`}
      />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-card/80 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden"
            >
              <Menu className="w-5 h-5" />
            </Button>

            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <img
                  src={process.env.NEXT_PUBLIC_LOGO_PATH || "/logo.svg"}
                  alt="Logo"
                  className="w-5 h-5"
                />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground truncate max-w-[200px] sm:max-w-none">
                  {process.env.NEXT_PUBLIC_APP_TITLE || "ADK Agent"}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {currentSessionTitle}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={createNewSession}
              variant="outline"
              size="sm"
              className="hidden sm:flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Chat</span>
            </Button>
            <Button
              onClick={handleExport}
              variant="outline"
              size="sm"
              className="hidden sm:flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </Button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Mobile action buttons */}
            <Button
              onClick={createNewSession}
              variant="outline"
              size="icon"
              className="sm:hidden"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleExport}
              variant="outline"
              size="icon"
              className="sm:hidden"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Messages area */}
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="max-w-4xl mx-auto space-y-2">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">
                    Welcome to AI Chat
                  </h2>
                  <p className="text-muted-foreground max-w-md">
                    Start a conversation by typing a message below. I'm here to
                    help with any questions or tasks you have.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md w-full">
                  {suggestedQuestions.map((sq, index) => (
                    <Card
                      key={index}
                      className="p-4 hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => setInput(sq.question)}
                    >
                      <div className="flex items-center space-x-2">
                        {getIcon(sq.icon)}
                        <span className="text-sm font-medium">{sq.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {sq.question}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <MessageItem
                    key={index}
                    message={message}
                    isLast={index === messages.length - 1}
                  />
                ))}
                {isSending && (
                  <div className="flex items-start space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                        AI
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 max-w-[80%]">
                      <Card className="p-4 shadow-sm">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div
                              className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                              style={{ animationDelay: "0ms" }}
                            />
                            <div
                              className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                              style={{ animationDelay: "150ms" }}
                            />
                            <div
                              className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                              style={{ animationDelay: "300ms" }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            AI is thinking...
                          </span>
                        </div>
                      </Card>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="border-t border-border bg-card/80 backdrop-blur-sm p-4">
          <div className="max-w-4xl mx-auto">
            <div className="relative flex items-end space-x-2">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isSending}
                  className="pr-12 min-h-[48px] py-3 resize-none"
                />
                <div className="absolute right-2 bottom-2 text-xs text-muted-foreground">
                  {input.length > 0 && (
                    <span
                      className={
                        input.length > 1000
                          ? "text-red-500"
                          : "text-muted-foreground"
                      }
                    >
                      {input.length}/1000
                    </span>
                  )}
                </div>
              </div>
              <Button
                onClick={handleSend}
                disabled={isSending || !input.trim()}
                className="h-12 px-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <Send className="w-4 h-4" />
                <span className="sr-only">Send message</span>
              </Button>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>Press Enter to send, Shift+Enter for new line</span>
              {isSending && <span>Sending...</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

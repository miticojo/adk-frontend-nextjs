"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Check, Copy, RefreshCw, User, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Message } from "@/lib/api";

interface MessageItemProps {
  message: Message;
  isLast: boolean;
  onRegenerate?: () => void;
}

export function MessageItem({
  message,
  isLast,
  onRegenerate,
}: MessageItemProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const content = message.content || "";
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const formatContent = (content: string) => {
    if (!content || typeof content !== "string") {
      return "";
    }
    return content.replace(/\n/g, "\n\n");
  };

  const isUser = message.role === "user";

  return (
    <div
      className={`flex items-start gap-4 group ${
        isUser ? "flex-row-reverse" : ""
      }`}
    >
      {/* Avatar */}
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarFallback
          className={`text-s font-medium ${
            isUser
              ? "bg-gradient-to-br from-green-500 to-teal-600 text-white"
              : "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
          }`}
        >
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Message content */}
      <div
        className={`flex-1 max-w-[80%] relative ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        {/* Message label */}
        <div
          className={`text-s font-medium text-muted-foreground mb-1 ${
            isUser ? "text-right" : "text-left"
          }`}
        >
          {isUser ? "You" : "AI Assistant"}
        </div>

        {/* Message bubble */}
        <Card
          className={`relative transition-all duration-200 hover:shadow-md ${
            isUser
              ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-200 dark:border-blue-800"
              : "bg-card text-card-foreground border-border hover:bg-accent/50"
          }`}
        >
          <div className="px-4 relative">
            <div
              className={`text-xs max-w-none ${
                isUser ? "text-white" : "text-card-foreground"
              }`}
            >
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p className="mb-0.5 last:mb-0 leading-tight text-xs">
                      {children}
                    </p>
                  ),
                  code: ({ children, className, ...props }) => {
                    const isInline = !className?.includes("language-");
                    return isInline ? (
                      <code
                        className={`px-4 rounded text-xs font-mono ${
                          isUser
                            ? "bg-blue-400/30 text-blue-100"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                        }`}
                        {...props}
                      >
                        {children}
                      </code>
                    ) : (
                      <div
                        className={`rounded-md overflow-hidden my-2 ${
                          isUser
                            ? "bg-blue-400/20"
                            : "bg-slate-100 dark:bg-slate-700"
                        }`}
                      >
                        <div
                          className={`px-3 py-1 text-xs font-medium border-b ${
                            isUser
                              ? "bg-blue-400/30 text-blue-100 border-blue-400/40"
                              : "bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {className?.replace("language-", "") || "code"}
                        </div>
                        <code
                          className={`block p-2 text-xs font-mono overflow-x-auto ${
                            isUser
                              ? "text-blue-50"
                              : "text-slate-800 dark:text-slate-200"
                          }`}
                          {...props}
                        >
                          {children}
                        </code>
                      </div>
                    );
                  },
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside mb-2 space-y-1">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside mb-2 space-y-1">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed">{children}</li>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote
                      className={`border-l-4 pl-4 italic mb-2 ${
                        isUser
                          ? "border-blue-300 text-blue-100"
                          : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {children}
                    </blockquote>
                  ),
                  h1: ({ children }) => (
                    <h1 className="text-lg font-bold mb-2">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-base font-bold mb-2">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-bold mb-2">{children}</h3>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold">{children}</strong>
                  ),
                  em: ({ children }) => <em className="italic">{children}</em>,
                }}
              >
                {formatContent(message.content)}
              </ReactMarkdown>
            </div>
          </div>

          {/* Action buttons */}
          <div
            className={`absolute top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
              isUser ? "left-2" : "right-2"
            }`}
          >
            <div className="flex gap-1 bg-card border border-border rounded-lg p-1 shadow-lg">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-accent"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{copied ? "Copied!" : "Copy message"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {!isUser && isLast && onRegenerate && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-accent"
                        onClick={onRegenerate}
                      >
                        <RefreshCw className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Regenerate response</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>

          {/* Message tail/pointer */}
          <div
            className={`absolute top-3 w-0 h-0 ${
              isUser
                ? "right-[-8px] border-l-8 border-l-blue-500 border-t-4 border-t-transparent border-b-4 border-b-transparent"
                : "left-[-8px] border-r-8 border-r-card border-t-4 border-t-transparent border-b-4 border-b-transparent"
            }`}
          />
        </Card>

        {/* Timestamp */}
        <div
          className={`text-xs text-muted-foreground mt-1 ${
            isUser ? "text-right" : "text-left"
          }`}
        >
          {new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}

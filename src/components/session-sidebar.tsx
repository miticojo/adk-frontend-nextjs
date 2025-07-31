"use client";

import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Download,
  Copy,
  Search,
  MessageSquare,
  Calendar,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChatSession, SessionStorage } from "@/lib/session-storage";
import { ExportUtils } from "@/lib/export-utils";
import { formatDistanceToNow } from "date-fns";

interface SessionSidebarProps {
  currentSessionId: string | null;
  onSessionSelect: (session: ChatSession | null) => void;
  onNewSession: () => void;
  className?: string;
}

export function SessionSidebar({
  currentSessionId,
  onSessionSelect,
  onNewSession,
  className = "",
}: SessionSidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSessions();
    // Refresh sessions every 5 seconds to catch updates from other tabs
    const interval = setInterval(loadSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  // Debounce search query to prevent excessive re-renders
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadSessions = () => {
    const allSessions = SessionStorage.getSessions();
    setSessions(allSessions);
  };

  const filteredSessions = sessions.filter((session) =>
    session.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
  );

  // Group sessions by date
  const groupedSessions = filteredSessions.reduce((groups, session) => {
    const today = new Date();
    const sessionDate = new Date(session.updatedAt);
    const isToday = sessionDate.toDateString() === today.toDateString();
    const isYesterday =
      sessionDate.toDateString() ===
      new Date(today.getTime() - 24 * 60 * 60 * 1000).toDateString();

    let group;
    if (isToday) {
      group = "Today";
    } else if (isYesterday) {
      group = "Yesterday";
    } else {
      group = sessionDate.toLocaleDateString([], {
        month: "long",
        day: "numeric",
      });
    }

    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(session);
    return groups;
  }, {} as Record<string, ChatSession[]>);

  const handleSessionClick = async (session: ChatSession) => {
    await onSessionSelect(session);
    setIsMobileOpen(false);
  };

  const handleNewSession = () => {
    onNewSession();
    setIsMobileOpen(false);
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this session?")) {
      SessionStorage.deleteSession(sessionId);
      loadSessions();
      if (currentSessionId === sessionId) {
        onSessionSelect(null);
      }
    }
  };

  const handleExport = (
    e: React.MouseEvent,
    session: ChatSession,
    format: "json" | "markdown" | "text"
  ) => {
    e.stopPropagation();

    switch (format) {
      case "json":
        ExportUtils.exportToJSON(session);
        break;
      case "markdown":
        ExportUtils.exportToMarkdown(session);
        break;
      case "text":
        ExportUtils.exportToText(session);
        break;
    }
  };

  const handleCopy = async (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    try {
      await ExportUtils.copyToClipboard(session);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card/95 backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            {!isCollapsed && (
              <h2 className="text-lg font-semibold text-foreground">
                Chat History
              </h2>
            )}
          </div>

          {!isCollapsed && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNewSession}
                    className="h-8 w-8 hover:bg-accent text-foreground"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>New Chat</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {!isCollapsed && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        )}
      </div>

      {/* Sessions list */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {isCollapsed ? (
            // Collapsed view - show only icons
            <div className="space-y-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleNewSession}
                      className="w-10 h-10 hover:bg-accent text-foreground"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>New Chat</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {sessions.slice(0, 8).map((session) => (
                <TooltipProvider key={session.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSessionClick(session)}
                        className={`w-10 h-10 ${
                          currentSessionId === session.id
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-accent text-foreground"
                        }`}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="max-w-xs truncate">{session.title}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          ) : (
            // Expanded view
            <div className="space-y-1">
              {Object.keys(groupedSessions).length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">
                    {searchQuery
                      ? "No conversations found"
                      : "No conversations yet"}
                  </p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Start a new chat to get going
                  </p>
                </div>
              ) : (
                Object.entries(groupedSessions).map(
                  ([group, groupSessions]) => (
                    <div key={group} className="mb-4">
                      <div className="flex items-center space-x-2 px-2 py-1 mb-2">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {group}
                        </h3>
                      </div>

                      <div className="space-y-1">
                        {groupSessions.map((session) => (
                          <div key={session.id} className="relative group">
                            <div
                              className={`
                              cursor-pointer rounded-lg p-3 transition-all duration-200
                              hover:bg-accent
                              ${
                                currentSessionId === session.id
                                  ? "bg-primary/10 border border-primary/20"
                                  : "hover:shadow-sm"
                              }
                            `}
                              onClick={() => handleSessionClick(session)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0 pr-2">
                                  <p
                                    className={`text-sm font-medium truncate leading-tight ${
                                      currentSessionId === session.id
                                        ? "text-primary"
                                        : "text-foreground"
                                    }`}
                                  >
                                    {session.title}
                                  </p>

                                  <div className="flex items-center space-x-2 mt-1">
                                    <p className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(session.updatedAt, {
                                        addSuffix: true,
                                      })}
                                    </p>
                                    <Badge
                                      variant="secondary"
                                      className="h-4 px-1.5 text-xs"
                                    >
                                      {session.messages.length}
                                    </Badge>
                                  </div>
                                </div>

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MoreVertical className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="w-48"
                                  >
                                    <DropdownMenuItem
                                      onClick={(e) => handleCopy(e, session)}
                                      className="text-sm"
                                    >
                                      <Copy className="h-4 w-4 mr-2" />
                                      Copy to Clipboard
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) =>
                                        handleExport(e, session, "json")
                                      }
                                      className="text-sm"
                                    >
                                      <Download className="h-4 w-4 mr-2" />
                                      Export as JSON
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) =>
                                        handleExport(e, session, "markdown")
                                      }
                                      className="text-sm"
                                    >
                                      <Download className="h-4 w-4 mr-2" />
                                      Export as Markdown
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) =>
                                        handleExport(e, session, "text")
                                      }
                                      className="text-sm"
                                    >
                                      <Download className="h-4 w-4 mr-2" />
                                      Export as Text
                                    </DropdownMenuItem>
                                    <Separator />
                                    <DropdownMenuItem
                                      onClick={(e) =>
                                        handleDeleteSession(e, session.id)
                                      }
                                      className="text-destructive focus:text-destructive text-sm"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`hidden md:block h-full ${className}`}>
        <div
          className={`h-full border-r border-border transition-all duration-300 ${
            isCollapsed ? "w-16" : "w-80"
          }`}
        >
          <div className="h-full relative">
            <SidebarContent />

            <Button
              variant="outline"
              size="icon"
              className="absolute bottom-4 right-2 z-10 h-6 w-6 bg-card/90 shadow-sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className="md:hidden">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="fixed top-4 left-4 z-50 bg-card/80 backdrop-blur-sm"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

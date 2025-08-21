'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageSquare, Plus, History, PlusCircle, FileText, GitBranch, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    type?: 'document' | 'diagram' | 'analysis';
    title?: string;
  };
}

interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastMessage: Date;
  projectId?: string;
  projectName?: string;
}

interface SuggestedPrompt {
  id: string;
  text: string;
  category: 'quick' | 'document' | 'analysis' | 'diagram';
  icon: React.ComponentType<{ className?: string }>;
}

const quickPrompts: SuggestedPrompt[] = [
  { id: '1', text: 'Analyze my current sprint progress', category: 'quick', icon: BarChart3 },
  { id: '2', text: 'What tasks are blocked or overdue?', category: 'quick', icon: MessageSquare },
  { id: '3', text: 'Generate sprint retrospective notes', category: 'document', icon: FileText },
  { id: '4', text: 'Create a user journey flowchart', category: 'diagram', icon: GitBranch },
];

const contextualPrompts: SuggestedPrompt[] = [
  { id: '5', text: 'Explain this in more detail', category: 'quick', icon: MessageSquare },
  { id: '6', text: 'Create an action plan from this', category: 'document', icon: FileText },
  { id: '7', text: 'Turn this into a visual diagram', category: 'diagram', icon: GitBranch },
  { id: '8', text: 'What are the next steps?', category: 'quick', icon: Sparkles },
];

interface AIHubChatInterfaceProps {
  userId: string;
}

export function AIHubChatInterface({ userId }: AIHubChatInterfaceProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize with a default chat
  useEffect(() => {
    const defaultChat: Chat = {
      id: 'default',
      title: 'New Chat',
      messages: [],
      lastMessage: new Date(),
    };
    setChats([defaultChat]);
    setActiveChat('default');
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, activeChat]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const currentChat = chats.find(c => c.id === activeChat);
  const isNewChat = currentChat?.messages.length === 0;
  const hasConversation = currentChat && currentChat.messages.length > 0;

  const createNewChat = () => {
    const newChat: Chat = {
      id: `chat-${Date.now()}`,
      title: 'New Chat',
      messages: [],
      lastMessage: new Date(),
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChat(newChat.id);
    setInput('');
  };

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || loading || !activeChat) return;

    setLoading(true);
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content: text,
      timestamp: new Date(),
    };

    // Add user message
    setChats(prev => prev.map(chat => 
      chat.id === activeChat 
        ? { 
            ...chat, 
            messages: [...chat.messages, userMessage],
            title: chat.title === 'New Chat' ? text.slice(0, 50) + (text.length > 50 ? '...' : '') : chat.title,
            lastMessage: new Date()
          }
        : chat
    ));

    setInput('');

    try {
      const response = await fetch('/api/ai/hub/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: text,
          userId,
          chatHistory: currentChat?.messages.slice(-5) // Include recent context
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now()}-assistant`,
          type: 'assistant',
          content: result.content,
          timestamp: new Date(),
          metadata: {
            type: result.type,
            title: result.title
          }
        };

        setChats(prev => prev.map(chat => 
          chat.id === activeChat 
            ? { 
                ...chat, 
                messages: [...chat.messages, assistantMessage],
                lastMessage: new Date()
              }
            : chat
        ));
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        type: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };

      setChats(prev => prev.map(chat => 
        chat.id === activeChat 
          ? { ...chat, messages: [...chat.messages, errorMessage] }
          : chat
      ));
    } finally {
      setLoading(false);
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    setTimeout(() => sendMessage(prompt), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      sendMessage();
    }
  };

  const deleteChat = (chatId: string) => {
    setChats(prev => prev.filter(c => c.id !== chatId));
    if (activeChat === chatId) {
      const remaining = chats.filter(c => c.id !== chatId);
      setActiveChat(remaining[0]?.id || null);
      if (remaining.length === 0) {
        createNewChat();
      }
    }
  };

  return (
    <div className="flex h-[calc(100vh-2rem)] max-w-7xl mx-auto border rounded-lg overflow-hidden bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r bg-muted/30">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Assistant
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={createNewChat}
              className="h-8 w-8"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`p-3 rounded-lg cursor-pointer mb-2 transition-colors hover:bg-accent/80 ${
                  activeChat === chat.id ? 'bg-accent' : ''
                }`}
                onClick={() => setActiveChat(chat.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{chat.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {chat.lastMessage.toLocaleDateString()}
                    </p>
                    {chat.projectName && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        {chat.projectName}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}
                    className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {isNewChat ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
              <div className="space-y-2">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Welcome to AI Hub</h3>
                <p className="text-muted-foreground max-w-md">
                  Your creative AI workspace for documents, analysis, and strategic insights. Ask me anything!
                </p>
              </div>

              {/* Quick Prompts */}
              <div className="w-full max-w-2xl space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">Try these prompts:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {quickPrompts.map((prompt) => (
                    <Card
                      key={prompt.id}
                      className="p-3 cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
                      onClick={() => handlePromptClick(prompt.text)}
                    >
                      <CardContent className="p-0">
                        <div className="flex items-center gap-3">
                          <prompt.icon className="h-4 w-4 text-primary" />
                          <span className="text-sm">{prompt.text}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {currentChat?.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.type === 'assistant' && message.metadata?.title && (
                      <div className="font-medium text-sm mb-2 flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        {message.metadata.title}
                        {message.metadata.type && (
                          <Badge variant="secondary" className="text-xs">
                            {message.metadata.type}
                          </Badge>
                        )}
                      </div>
                    )}
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown
                        components={{
                          code: ({ inline, children }) => (
                            inline ? (
                              <code className="bg-background/50 px-1 py-0.5 rounded text-sm">
                                {children}
                              </code>
                            ) : (
                              <pre className="bg-background/80 p-3 rounded-lg overflow-x-auto">
                                <code>{children}</code>
                              </pre>
                            )
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    <div className="text-xs opacity-60 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-4 max-w-[80%]">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                      <span className="text-sm text-muted-foreground">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Contextual Suggestions */}
        {hasConversation && !loading && (
          <div className="border-t bg-muted/30 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Quick follow-ups:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {contextualPrompts.slice(0, 3).map((prompt) => (
                <Button
                  key={prompt.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePromptClick(prompt.text)}
                  className="h-7 text-xs"
                >
                  <prompt.icon className="h-3 w-3 mr-1" />
                  {prompt.text}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything... Create documents, analyze data, generate diagrams, or get strategic insights."
                className="min-h-[44px] max-h-[120px] resize-none pr-12"
                disabled={loading}
              />
              <Button
                size="icon"
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="absolute right-2 bottom-2 h-8 w-8"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground">
              Press <kbd className="px-1 py-0.5 bg-muted rounded">⌘ + Enter</kbd> to send
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              <span>Powered by GPT-4</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

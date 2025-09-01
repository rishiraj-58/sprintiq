'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, FileText, GitBranch, BarChart3, Zap, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';

interface AIHubClientProps {
  userId: string;
}

interface GeneratedContent {
  id: string;
  type: 'document' | 'diagram' | 'analysis';
  title: string;
  content: string;
  timestamp: Date;
  prompt: string;
}

const suggestedPrompts = [
  {
    category: 'Documents',
    icon: FileText,
    prompts: [
      'Draft a technical specification document for a new user authentication system',
      'Create a project requirements document for mobile app development',
      'Generate a code review checklist for React components',
      'Write a deployment guide for our microservices architecture'
    ]
  },
  {
    category: 'Diagrams',
    icon: GitBranch,
    prompts: [
      'Create a flowchart showing our current user registration process',
      'Generate a system architecture diagram for our backend services',
      'Design a database schema diagram for e-commerce platform',
      'Create a user journey map for the onboarding process'
    ]
  },
  {
    category: 'Analysis',
    icon: BarChart3,
    prompts: [
      'Analyze recent sprint performance and identify improvement areas',
      'Generate a report on current bug trends and their root causes',
      'Create a technical debt assessment for our codebase',
      'Analyze team velocity and capacity planning recommendations'
    ]
  }
];

export function AIHubClient({ userId }: AIHubClientProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
  const [activeTab, setActiveTab] = useState('create');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize Mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
    });
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;

    setLoading(true);
    const prompt = input.trim();
    setInput('');

    try {
      const response = await fetch('/api/ai/hub/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt,
          userId,
          type: 'document' // Default type, can be enhanced later
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const newContent: GeneratedContent = {
          id: Date.now().toString(),
          type: result.type || 'document',
          title: result.title || 'Generated Content',
          content: result.content,
          timestamp: new Date(),
          prompt
        };
        
        setGeneratedContent(prev => [newContent, ...prev]);
        setActiveTab('history');
      } else {
        console.error('Failed to generate content');
      }
    } catch (error) {
      console.error('Error generating content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    setActiveTab('create');
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const downloadContent = (content: string, title: string) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderMermaidDiagram = async (content: string) => {
    try {
      const mermaidMatch = content.match(/```mermaid\n([\s\S]*?)\n```/);
      if (mermaidMatch) {
        const diagramCode = mermaidMatch[1];
        const { svg } = await mermaid.render('mermaid-diagram', diagramCode);
        return svg;
      }
    } catch (error) {
      console.error('Error rendering Mermaid diagram:', error);
    }
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">AI Hub</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Your creative AI workspace for documents, diagrams, and analysis
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Create
          </TabsTrigger>
          <TabsTrigger value="prompts" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Suggested Prompts
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            History ({generatedContent.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          {/* Main Input Area */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                What would you like me to create?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me to create anything... technical specs, flowcharts, project analysis, code documentation, or strategic reports. Be as detailed as you'd like!"
                className="min-h-[120px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleSubmit();
                  }
                }}
              />
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Press <kbd className="px-2 py-1 bg-muted rounded">⌘ + Enter</kbd> to generate
                </p>
                <Button 
                  onClick={handleSubmit} 
                  disabled={!input.trim() || loading}
                  className="min-w-[100px]"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Examples */}
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              <strong>Try these examples:</strong> "Create a technical spec for user profile uploads with S3 integration" • 
              "Generate a Mermaid flowchart for our authentication process" • 
              "Analyze our recent sprint data and suggest improvements"
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="prompts" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
            {suggestedPrompts.map((category) => (
              <Card key={category.category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <category.icon className="h-5 w-5" />
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {category.prompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handlePromptClick(prompt)}
                      className="w-full text-left p-3 rounded-lg border hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
                    >
                      {prompt}
                    </button>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {generatedContent.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No content generated yet</h3>
                <p className="text-muted-foreground text-center">
                  Start creating documents, diagrams, and analysis to see them here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {generatedContent.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{item.type}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {item.timestamp.toLocaleDateString()} at {item.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground italic">
                          "{item.prompt}"
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(item.content)}
                          title="Copy to clipboard"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => downloadContent(item.content, item.title)}
                          title="Download as markdown"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown
                        components={{
                          code: ({ node, className, children, ...props }) => {
                            const match = /language-(\w+)/.exec(className || '');
                            const isInline = !className?.includes('language-');
                            
                            if (!isInline && match && match[1] === 'mermaid') {
                              return (
                                <div className="mermaid-container bg-background border rounded p-4">
                                  <pre className="text-sm">
                                    <code {...props}>{children}</code>
                                  </pre>
                                </div>
                              );
                            }
                            
                            return isInline ? (
                              <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props}>
                                {children}
                              </code>
                            ) : (
                              <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                                <code {...props}>{children}</code>
                              </pre>
                            );
                          },
                        }}
                      >
                        {item.content}
                      </ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, Lightbulb, Target, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface WorkspaceSuggestion {
  id: string;
  type: 'productivity' | 'risk' | 'optimization' | 'team';
  title: string;
  description: string;
  action: string;
  priority: 'low' | 'medium' | 'high';
  impact: string;
}

interface AIWorkspaceSuggestionsProps {
  workspaceId: string;
  className?: string;
}

const typeIcons = {
  productivity: TrendingUp,
  risk: AlertTriangle,
  optimization: Lightbulb,
  team: Target
};

const priorityColors = {
  high: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950',
  medium: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950',
  low: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'
};

export function AIWorkspaceSuggestions({ workspaceId, className }: AIWorkspaceSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<WorkspaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadSuggestions();
  }, [workspaceId]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/suggestions/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, analysisType: 'workspace' }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to load workspace AI suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissSuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  if (suggestions.length === 0 && !loading) {
    return null;
  }

  return (
    <div className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="border-primary/20">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  AI Workspace Insights
                  {suggestions.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {suggestions.length}
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {lastUpdated && (
                    <span className="text-xs text-muted-foreground">
                      {lastUpdated.toLocaleTimeString()}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      loadSuggestions();
                    }}
                    disabled={loading}
                    className="h-8 w-8 p-0"
                  >
                    <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0">
              {loading && suggestions.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Analyzing workspace data...</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestions.map((suggestion) => {
                    const Icon = typeIcons[suggestion.type];
                    return (
                      <Alert key={suggestion.id} className={priorityColors[suggestion.priority]}>
                        <div className="flex items-start gap-3">
                          <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-sm">{suggestion.title}</h4>
                                  <Badge 
                                    variant={getPriorityBadgeVariant(suggestion.priority)}
                                    className="text-xs"
                                  >
                                    {suggestion.priority}
                                  </Badge>
                                </div>
                                <AlertDescription className="text-xs leading-relaxed">
                                  {suggestion.description}
                                </AlertDescription>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => dismissSuggestion(suggestion.id)}
                                className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="bg-background/50 rounded p-2 border">
                                <p className="text-xs font-medium text-foreground/80 mb-1">
                                  💡 Recommended Action:
                                </p>
                                <p className="text-xs text-foreground/70">
                                  {suggestion.action}
                                </p>
                              </div>
                              
                              {suggestion.impact && (
                                <div className="bg-primary/10 rounded p-2 border border-primary/20">
                                  <p className="text-xs font-medium text-primary mb-1">
                                    🎯 Expected Impact:
                                  </p>
                                  <p className="text-xs text-primary/80">
                                    {suggestion.impact}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Alert>
                    );
                  })}
                  
                  {suggestions.length === 0 && !loading && (
                    <Alert>
                      <Lightbulb className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        Your workspace is running smoothly! Check back later for updated insights.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}

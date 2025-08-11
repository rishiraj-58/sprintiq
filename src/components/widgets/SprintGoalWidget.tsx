'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Calendar } from 'lucide-react';

interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  goal?: string;
  status: string;
}

interface SprintGoalWidgetProps {
  activeSprint?: Sprint;
}

export function SprintGoalWidget({ activeSprint }: SprintGoalWidgetProps) {
  if (!activeSprint) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Sprint Goal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-muted-foreground text-sm">
              No active sprint
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Start a sprint to see its goal here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-4 w-4 text-blue-600" />
          Sprint Goal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">{activeSprint.name}</h3>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
              Active
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Calendar className="h-3 w-3" />
            <span>
              {formatDate(activeSprint.startDate)} - {formatDate(activeSprint.endDate)}
            </span>
          </div>
        </div>

        <div className="border-t pt-3">
          <h4 className="text-sm font-medium mb-2">Goal</h4>
          <p className="text-sm text-muted-foreground">
            {activeSprint.goal || 'No goal specified for this sprint.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

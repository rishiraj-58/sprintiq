'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, 
  AlertCircle, 
  UserPlus, 
  Play, 
  Pause,
  GitCommit,
  MessageSquare,
  Bug
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'task_completed' | 'bug_reported' | 'member_added' | 'sprint_started' | 'sprint_completed' | 'task_created' | 'comment_added';
  message: string;
  user: {
    name: string;
    avatar?: string;
  };
  timestamp: string;
  metadata?: {
    taskTitle?: string;
    sprintName?: string;
    memberName?: string;
  };
}

interface RecentActivityFeedProps {
  activities: ActivityItem[];
}

const activityIcons = {
  task_completed: CheckCircle,
  bug_reported: Bug,
  member_added: UserPlus,
  sprint_started: Play,
  sprint_completed: Pause,
  task_created: GitCommit,
  comment_added: MessageSquare
};

const activityColors = {
  task_completed: 'text-green-600',
  bug_reported: 'text-red-600',
  member_added: 'text-blue-600',
  sprint_started: 'text-purple-600',
  sprint_completed: 'text-indigo-600',
  task_created: 'text-orange-600',
  comment_added: 'text-slate-600'
};

// Static data for demo
const staticActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'task_completed',
    message: 'completed task "Implement user authentication"',
    user: { name: 'Sarah Chen', avatar: '' },
    timestamp: '2024-01-15T10:30:00Z',
    metadata: { taskTitle: 'Implement user authentication' }
  },
  {
    id: '2',
    type: 'bug_reported',
    message: 'reported a bug in the login flow',
    user: { name: 'Mike Johnson', avatar: '' },
    timestamp: '2024-01-15T09:45:00Z'
  },
  {
    id: '3',
    type: 'sprint_started',
    message: 'started sprint "January 2024 Sprint"',
    user: { name: 'Alex Rivera', avatar: '' },
    timestamp: '2024-01-15T09:00:00Z',
    metadata: { sprintName: 'January 2024 Sprint' }
  },
  {
    id: '4',
    type: 'member_added',
    message: 'added Emma Wilson to the project',
    user: { name: 'David Park', avatar: '' },
    timestamp: '2024-01-14T16:20:00Z',
    metadata: { memberName: 'Emma Wilson' }
  },
  {
    id: '5',
    type: 'task_created',
    message: 'created task "Design new dashboard layout"',
    user: { name: 'Lisa Wong', avatar: '' },
    timestamp: '2024-01-14T14:15:00Z',
    metadata: { taskTitle: 'Design new dashboard layout' }
  },
  {
    id: '6',
    type: 'comment_added',
    message: 'commented on "Fix mobile responsive issues"',
    user: { name: 'James Smith', avatar: '' },
    timestamp: '2024-01-14T11:30:00Z'
  },
  {
    id: '7',
    type: 'task_completed',
    message: 'completed task "Update API documentation"',
    user: { name: 'Sarah Chen', avatar: '' },
    timestamp: '2024-01-14T10:45:00Z'
  },
  {
    id: '8',
    type: 'bug_reported',
    message: 'reported a bug in the notification system',
    user: { name: 'Chris Lee', avatar: '' },
    timestamp: '2024-01-13T15:20:00Z'
  }
];

export function RecentActivityFeed({ activities = staticActivities }: RecentActivityFeedProps) {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-80">
          <div className="space-y-4 p-6 pt-0">
            {activities.map((activity) => {
              const Icon = activityIcons[activity.type];
              const iconColor = activityColors[activity.type];
              
              return (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`mt-1 ${iconColor}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={activity.user.avatar} />
                        <AvatarFallback className="text-xs">
                          {activity.user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{activity.user.name}</span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {activity.message}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(activity.timestamp)}
                      </span>
                      
                      {activity.type === 'bug_reported' && (
                        <Badge variant="destructive" className="text-xs">
                          Bug
                        </Badge>
                      )}
                      
                      {activity.type === 'task_completed' && (
                        <Badge variant="secondary" className="text-xs bg-green-50 text-green-700">
                          Completed
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

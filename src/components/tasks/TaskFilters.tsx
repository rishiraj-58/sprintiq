'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';
import { useTask } from '@/stores/hooks/useTask';

interface WorkspaceMember {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: string;
}

interface TaskFiltersProps {
  projectId: string;
  workspaceId: string;
}

export function TaskFilters({ projectId, workspaceId }: TaskFiltersProps) {
  const { filters, setFilters, clearFilters, fetchTasks } = useTask();
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // Fetch workspace members for assignee filter
  useEffect(() => {
    const fetchWorkspaceMembers = async () => {
      if (!workspaceId) return;
      
      try {
        setIsLoadingMembers(true);
        const response = await fetch(`/api/workspaces/${workspaceId}/members`);
        if (response.ok) {
          const data = await response.json();
          setWorkspaceMembers(data.members || []);
        }
      } catch (error) {
        console.error('Error fetching workspace members:', error);
      } finally {
        setIsLoadingMembers(false);
      }
    };

    fetchWorkspaceMembers();
  }, [workspaceId]);

  // Apply filters and refetch tasks
  const applyFilters = (newFilters: typeof filters) => {
    setFilters(newFilters);
    fetchTasks(projectId);
  };

  // Handle filter changes
  const handleStatusChange = (status: string) => {
    const newFilters = { ...filters, status: status === 'all' ? undefined : status };
    applyFilters(newFilters);
  };

  const handlePriorityChange = (priority: string) => {
    const newFilters = { ...filters, priority: priority === 'all' ? undefined : priority };
    applyFilters(newFilters);
  };

  const handleAssigneeChange = (assigneeId: string) => {
    const newFilters = { ...filters, assigneeId: assigneeId === 'all' ? undefined : assigneeId };
    applyFilters(newFilters);
  };

  // Clear all filters
  const handleClearFilters = () => {
    clearFilters();
    fetchTasks(projectId);
  };

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(value => value !== undefined);

  const getName = (firstName: string | null, lastName: string | null) => {
    return `${firstName || ''} ${lastName || ''}`.trim() || 'Unknown User';
  };

  const getAssigneeName = (assigneeId: string) => {
    if (assigneeId === 'unassigned') return 'Unassigned';
    const member = workspaceMembers.find(m => m.id === assigneeId);
    return member ? getName(member.firstName, member.lastName) : 'Unknown';
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <span>Task Filters</span>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-8 px-2"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select
              value={filters.status || 'all'}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Priority</label>
            <Select
              value={filters.priority || 'all'}
              onValueChange={handlePriorityChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assignee Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Assignee</label>
            <Select
              value={filters.assigneeId || 'all'}
              onValueChange={handleAssigneeChange}
              disabled={isLoadingMembers}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingMembers ? "Loading..." : "Filter by assignee"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {workspaceMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {getName(member.firstName, member.lastName)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {filters.status && (
                <Badge variant="secondary" className="text-xs">
                  Status: {filters.status.replace('_', ' ')}
                </Badge>
              )}
              {filters.priority && (
                <Badge variant="secondary" className="text-xs">
                  Priority: {filters.priority}
                </Badge>
              )}
              {filters.assigneeId && (
                <Badge variant="secondary" className="text-xs">
                  Assignee: {getAssigneeName(filters.assigneeId)}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

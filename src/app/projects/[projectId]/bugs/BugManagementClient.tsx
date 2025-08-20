'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Bug, AlertTriangle, AlertCircle, Zap, CheckCircle, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Bug = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  severity: string;
  projectId: string;
  reporterId: string;
  assigneeId: string | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  reporter: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    avatarUrl: string | null;
  } | null;
};

interface BugManagementClientProps {
  projectId: string;
  projectName: string;
  initialBugs: Bug[];
}

const statusConfig = {
  open: { label: 'Open', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  'in-progress': { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
};

const severityConfig = {
  low: { label: 'Low', color: 'bg-blue-100 text-blue-800', icon: Bug },
  medium: { label: 'Medium', color: 'bg-amber-100 text-amber-800', icon: AlertTriangle },
  high: { label: 'High', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-800', icon: Zap },
};

export function BugManagementClient({ projectId, projectName, initialBugs }: BugManagementClientProps) {
  const [bugs, setBugs] = useState<Bug[]>(initialBugs);
  const [filteredBugs, setFilteredBugs] = useState<Bug[]>(initialBugs);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // New bug form state
  const [newBug, setNewBug] = useState({
    title: '',
    description: '',
    severity: 'medium',
  });

  // Filter bugs based on search and filters
  useEffect(() => {
    let filtered = bugs;

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(bug =>
        bug.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bug.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(bug => bug.status === statusFilter);
    }

    // Severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter(bug => bug.severity === severityFilter);
    }

    setFilteredBugs(filtered);
  }, [bugs, searchQuery, statusFilter, severityFilter]);

  const handleCreateBug = async () => {
    if (!newBug.title.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/bugs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newBug.title,
          description: newBug.description || null,
          severity: newBug.severity,
          status: 'open',
        }),
      });

      if (response.ok) {
        const createdBug = await response.json();
        setBugs(prev => [createdBug, ...prev]);
        setNewBug({ title: '', description: '', severity: 'medium' });
        setIsCreateModalOpen(false);
      }
    } catch (error) {
      console.error('Failed to create bug:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBugStatus = async (bugId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/bugs`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bugId, status: newStatus }),
      });

      if (response.ok) {
        setBugs(prev => prev.map(bug => 
          bug.id === bugId 
            ? { ...bug, status: newStatus, updatedAt: new Date() }
            : bug
        ));
      }
    } catch (error) {
      console.error('Failed to update bug status:', error);
    }
  };

  const getBugCounts = () => {
    return {
      total: bugs.length,
      open: bugs.filter(b => b.status === 'open').length,
      inProgress: bugs.filter(b => b.status === 'in-progress').length,
      resolved: bugs.filter(b => b.status === 'resolved').length,
      critical: bugs.filter(b => b.severity === 'critical').length,
    };
  };

  const counts = getBugCounts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bugs — {projectName}</h1>
          <p className="text-muted-foreground">Track and resolve project issues</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Report Bug
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report New Bug</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newBug.title}
                  onChange={(e) => setNewBug(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief description of the bug"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newBug.description}
                  onChange={(e) => setNewBug(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description, steps to reproduce, expected vs actual behavior"
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="severity">Severity</Label>
                <Select value={newBug.severity} onValueChange={(value) => setNewBug(prev => ({ ...prev, severity: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateBug} disabled={loading || !newBug.title.trim()}>
                  {loading ? 'Creating...' : 'Create Bug'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Bugs</p>
              <p className="text-2xl font-bold">{counts.total}</p>
            </div>
            <Bug className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Open</p>
              <p className="text-2xl font-bold text-red-600">{counts.open}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold text-yellow-600">{counts.inProgress}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{counts.resolved}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Critical</p>
              <p className="text-2xl font-bold text-red-800">{counts.critical}</p>
            </div>
            <Zap className="h-8 w-8 text-red-800" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bugs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bug List */}
      <div className="space-y-4">
        {filteredBugs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Bug className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No bugs found</h3>
              <p className="text-muted-foreground text-center">
                {searchQuery || statusFilter !== 'all' || severityFilter !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'Great news! No bugs have been reported yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredBugs.map((bug) => {
            const StatusIcon = statusConfig[bug.status as keyof typeof statusConfig]?.icon || AlertCircle;
            const SeverityIcon = severityConfig[bug.severity as keyof typeof severityConfig]?.icon || Bug;
            
            return (
              <Card key={bug.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{bug.title}</h3>
                        <div className="flex items-center gap-2">
                          <Badge className={severityConfig[bug.severity as keyof typeof severityConfig]?.color}>
                            <SeverityIcon className="mr-1 h-3 w-3" />
                            {severityConfig[bug.severity as keyof typeof severityConfig]?.label}
                          </Badge>
                          <Badge className={statusConfig[bug.status as keyof typeof statusConfig]?.color}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {statusConfig[bug.status as keyof typeof statusConfig]?.label}
                          </Badge>
                        </div>
                      </div>
                      
                      {bug.description && (
                        <p className="text-muted-foreground line-clamp-2">{bug.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {bug.reporter && (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={bug.reporter.avatarUrl || undefined} />
                              <AvatarFallback className="text-xs">
                                {bug.reporter.firstName?.[0]}{bug.reporter.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span>Reported by {bug.reporter.firstName} {bug.reporter.lastName}</span>
                          </div>
                        )}
                        <span>Created {new Date(bug.createdAt).toLocaleDateString()}</span>
                        {bug.resolvedAt && (
                          <span>Resolved {new Date(bug.resolvedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Select
                        value={bug.status}
                        onValueChange={(value) => handleUpdateBugStatus(bug.id, value)}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}


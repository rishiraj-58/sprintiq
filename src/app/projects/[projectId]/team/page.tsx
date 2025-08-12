'use client';

import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  UserPlus,
  UserMinus,
  Mail,
  Calendar,
  Activity,
  Users,
  Crown,
  Shield,
  Eye,
  Settings,
  Trash2
} from 'lucide-react';

// Live project team data state
type ProjectMemberRow = {
  id: string;
  user: { id: string; firstName: string | null; lastName: string | null; email: string | null; avatarUrl: string | null; title?: string | null };
  role: 'owner' | 'manager' | 'member' | 'viewer';
  joinedAt?: string | null;
  lastActive?: string | null;
  tasksAssigned?: number;
  tasksCompleted?: number;
  permissions: string[];
};

// Available workspace members that can be added to project
const availableMembers = [
  {
    id: 'user_7',
    name: 'Tom Wilson',
    email: 'tom@company.com',
    avatar: null,
    title: 'Security Specialist'
  },
  {
    id: 'user_8',
    name: 'Jessica Brown',
    email: 'jessica@company.com',
    avatar: null,
    title: 'Data Analyst'
  },
  {
    id: 'user_9',
    name: 'Chris Johnson',
    email: 'chris@company.com',
    avatar: null,
    title: 'Mobile Developer'
  }
];

interface TeamPageProps {
  params: {
    projectId: string;
  };
}

export default function TeamPage({ params }: TeamPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedRole, setSelectedRole] = useState('member');
  const { user } = useUser();
  const projectPerms = usePermissions('project', params.projectId);
  const isMember = projectPerms.canCreate || projectPerms.canEdit ? !(projectPerms.canManageMembers || projectPerms.canManageSettings) : false;
  // Default booleans from backend perms
  let permsIsOwner = projectPerms.canManageSettings;
  let permsIsManager = !permsIsOwner && projectPerms.canManageMembers;
  
  const [members, setMembers] = useState<ProjectMemberRow[]>([]);
  const [workspacePool, setWorkspacePool] = useState<any[]>([]);

  const loadMembers = async () => {
    try {
      const res = await fetch(`/api/projects/${params.projectId}/members`, { headers: { 'Cache-Control': 'no-cache' } });
      if (!res.ok) return;
      const data = await res.json();
      const rows: ProjectMemberRow[] = (data.members || []).map((m: any) => ({
        id: m.id,
        user: { id: m.id, firstName: m.firstName, lastName: m.lastName, email: m.email, avatarUrl: null },
        role: m.role,
        joinedAt: m.joinedAt || null,
        lastActive: m.lastActiveAt || null,
        tasksAssigned: m.tasksAssigned ?? 0,
        tasksCompleted: m.tasksCompleted ?? 0,
        permissions: roleToCaps(m.role),
      }));
      setMembers(rows);
      setWorkspacePool(data.workspaceMembers || []);
    } catch (e) {
      console.error('Failed to load project members', e);
    }
  };

  useEffect(() => {
    const run = async () => {
      try {
        await loadMembers();
      } catch (e) {
        console.error(e);
      }
    };
    run();
  }, [params.projectId]);

  const roleToCaps = (role: string): string[] => {
    switch (role) {
      case 'owner':
        return ['view', 'create', 'edit', 'delete', 'manage_members', 'manage_settings'];
      case 'manager':
        return ['view', 'create', 'edit', 'manage_members'];
      case 'viewer':
        return ['view'];
      default:
        return ['view', 'create', 'edit'];
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'manager':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'member':
        return <Users className="h-4 w-4 text-green-600" />;
      case 'viewer':
        return <Eye className="h-4 w-4 text-gray-600" />;
      default:
        return <Users className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'member':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'viewer':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActivityStatus = (lastActive: string) => {
    const now = new Date();
    const lastActiveDate = new Date(lastActive);
    const diffInHours = (now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) return { status: 'online', text: 'Active now' };
    if (diffInHours < 24) return { status: 'recent', text: `${Math.floor(diffInHours)}h ago` };
    if (diffInHours < 168) return { status: 'away', text: `${Math.floor(diffInHours / 24)}d ago` };
    return { status: 'offline', text: 'Inactive' };
  };

  const getActivityStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'recent':
        return 'bg-yellow-500';
      case 'away':
        return 'bg-orange-500';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = !searchQuery || 
      `${member.user.firstName || ''} ${member.user.lastName || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.user.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const roleStats = useMemo(() => ({
    owner: members.filter(m => m.role === 'owner').length,
    manager: members.filter(m => m.role === 'manager').length,
    member: members.filter(m => m.role === 'member').length,
    viewer: members.filter(m => m.role === 'viewer').length
  }), [members]);

  // Derive current user's project role from members list if possible
  const myProjectRole = useMemo(() => {
    if (!user?.id) return null;
    const me = members.find(m => m.id === user.id);
    return me?.role || null;
  }, [user?.id, members]);

  const isOwnerUser = myProjectRole ? myProjectRole === 'owner' : permsIsOwner;
  const isManagerUser = myProjectRole ? myProjectRole === 'manager' : (!isOwnerUser && permsIsManager);

  const handleAddMember = () => {
    // Add member logic would go here
    console.log('Adding member:', selectedMember, 'with role:', selectedRole);
    setIsAddMemberOpen(false);
    setSelectedMember('');
    setSelectedRole('member');
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    try {
      const res = await fetch(`/api/projects/${params.projectId}/members?profileId=${memberToRemove}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove member');
      await loadMembers();
    } catch (e) {
      console.error(e);
    } finally {
      setMemberToRemove(null);
    }
  };

  const handleRoleChange = (memberId: string, newRole: string) => {
    // Role change logic would go here
    console.log('Changing role for member:', memberId, 'to:', newRole);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Project Team</h1>
          <p className="text-muted-foreground">
            Manage team members and their roles for this project
          </p>
        </div>
        {!isMember && (
          <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Add Member
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
              <DialogDescription>
                Add a workspace member to this project
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Member</label>
                <Select value={selectedMember} onValueChange={setSelectedMember}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a workspace member" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={member.avatar || undefined} />
                            <AvatarFallback className="text-xs">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-xs text-muted-foreground">{member.title}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Role</label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={handleAddMember} disabled={!selectedMember} className="flex-1">
                  Add to Project
                </Button>
                <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Total Members</span>
              </div>
              <div className="text-2xl font-bold">{members.length}</div>
              <div className="text-xs text-muted-foreground">
                Active project members
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Active Today</span>
              </div>
              <div className="text-2xl font-bold">
                {members.filter(m => typeof m.lastActive === 'string' && (() => {
                  const la = m.lastActive as string;
                  const st = getActivityStatus(la).status;
                  return st === 'online' || st === 'recent';
                })()).length}
              </div>
              <div className="text-xs text-muted-foreground">
                Members online or recently active
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">Owners & Managers</span>
              </div>
              <div className="text-2xl font-bold">{roleStats.owner + roleStats.manager}</div>
              <div className="text-xs text-muted-foreground">
                Administrative roles
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Tasks Assigned</span>
              </div>
              <div className="text-2xl font-bold">{members.reduce((sum, member) => sum + (member.tasksAssigned || 0), 0)}</div>
              <div className="text-xs text-muted-foreground">
                Total active assignments
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search members by name, email, or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Users className="h-4 w-4" />
                  Role: {roleFilter === 'all' ? 'All' : roleFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Filter by Role</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setRoleFilter('all')}>
                  All Roles
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoleFilter('owner')}>
                  Owner ({roleStats.owner})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoleFilter('manager')}>
                  Manager ({roleStats.manager})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoleFilter('member')}>
                  Member ({roleStats.member})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoleFilter('viewer')}>
                  Viewer ({roleStats.viewer})
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Team Members Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>Tasks</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
              {filteredMembers.map((member) => {
              const activityStatus = typeof member.lastActive === 'string' ? getActivityStatus(member.lastActive) : { status: 'offline', text: 'Inactive' };
              
              return (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                           <AvatarImage src={member.user.avatarUrl || undefined} />
                          <AvatarFallback>
                             {`${member.user.firstName || ''} ${member.user.lastName || ''}`.trim().split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-background ${getActivityStatusColor(activityStatus.status)}`} />
                      </div>
                      <div>
                        <div className="font-medium">{`${member.user.firstName || ''} ${member.user.lastName || ''}`.trim() || 'Unknown'}</div>
                        {member.user.title && (
                          <div className="text-sm text-muted-foreground">{member.user.title}</div>
                        )}
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {member.user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant="outline" className={getRoleBadgeColor(member.role)}>
                        <span className="flex items-center gap-1">
                          {getRoleIcon(member.role)}
                          {member.role}
                        </span>
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {member.permissions.length} permission{member.permissions.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">{activityStatus.text}</div>
                       {typeof member.lastActive === 'string' ? (
                         <div className="text-xs text-muted-foreground">Last: {new Date(member.lastActive || '').toLocaleDateString()}</div>
                       ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                       <div className="text-sm">
                         <span className="font-medium">{member.tasksCompleted ?? 0}</span>
                         <span className="text-muted-foreground">/{member.tasksAssigned ?? 0}</span>
                       </div>
                       <div className="text-xs text-muted-foreground">
                         {(() => {
                           const a = member.tasksAssigned || 0;
                           const c = member.tasksCompleted || 0;
                           return a ? Math.round((c / a) * 100) : 0;
                         })()}% complete
                       </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {member.joinedAt ? new Date(member.joinedAt as any).toLocaleDateString() : '—'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {(isOwnerUser || isManagerUser) && (
                      <select 
                        className="border rounded px-2 py-1 text-sm bg-white"
                        onChange={(e) => {
                          const action = e.target.value;
                          if (action === 'remove') {
                            setMemberToRemove(member.id);
                          } else if (action === 'viewer' || action === 'member' || action === 'manager') {
                            handleRoleChange(member.id, action);
                          }
                          // Reset to empty after action
                          e.target.value = '';
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="">••• Actions</option>
                        <option value="viewer">👁️ Make Viewer</option>
                        <option value="member">👥 Make Member</option>
                        <option value="manager">🛡️ Make Manager</option>
                        {(isOwnerUser || (isManagerUser && member.role !== 'owner')) && (
                          <option value="remove">❌ Remove from Project</option>
                        )}
                      </select>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {filteredMembers.length === 0 && (
        <Card className="p-12 text-center">
          <div className="space-y-3">
            <div className="mx-auto h-12 w-12 bg-muted rounded-full flex items-center justify-center">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-medium">No team members found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your search criteria or add new members
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Remove Member Dialog */}
      {!isMember && (
        <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove this member from the project? They will lose access to all project resources and their assigned tasks will become unassigned.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRemoveMember} className="bg-destructive text-destructive-foreground">
                Remove Member
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

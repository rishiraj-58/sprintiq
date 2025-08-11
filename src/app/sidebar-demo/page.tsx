'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkspaceSidebar } from '@/components/layout/WorkspaceSidebar';
import { ProjectSidebar } from '@/components/layout/ProjectSidebar';
import { UserRole } from '@/config/sidebarConfig';
import { Badge } from '@/components/ui/badge';

export default function SidebarDemoPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('owner');
  const [sidebarType, setSidebarType] = useState<'workspace' | 'project'>('workspace');

  const mockWorkspaceId = 'demo-workspace-123';
  const mockProjectId = 'demo-project-456';
  const currentPath = sidebarType === 'workspace' 
    ? `/dashboard/workspace/${mockWorkspaceId}` 
    : `/projects/${mockProjectId}`;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Role-Based Sidebar Demo</h1>
          <p className="text-muted-foreground">
            Showcase of the dynamic sidebar system that adapts to user roles and contexts
          </p>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Demo Controls</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">User Role</label>
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sidebar Context</label>
              <Select value={sidebarType} onValueChange={(value) => setSidebarType(value as 'workspace' | 'project')}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="workspace">Workspace</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card className="h-[600px]">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  {sidebarType === 'workspace' ? 'Workspace Sidebar' : 'Project Sidebar'}
                  <Badge variant="outline" className="capitalize">
                    {selectedRole}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-full">
                <div className="h-full border rounded-md overflow-hidden">
                  {sidebarType === 'workspace' ? (
                    <WorkspaceSidebar
                      role={selectedRole}
                      workspaceId={mockWorkspaceId}
                      currentPath={currentPath}
                      onNavigate={() => console.log('Navigation in demo mode')}
                    />
                  ) : (
                    <ProjectSidebar
                      role={selectedRole}
                      projectId={mockProjectId}
                      workspaceId={mockWorkspaceId}
                      currentPath={currentPath}
                      onNavigate={() => console.log('Navigation in demo mode')}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Role Capabilities & Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedRole === 'owner' && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-red-600">Owner Role</h3>
                      <p className="text-sm text-muted-foreground">
                        Full access to all workspace and project features including billing, usage, audit logs, and organization settings.
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>• Complete workspace management</div>
                        <div>• Billing & subscription control</div>
                        <div>• User role assignment</div>
                        <div>• Audit log access</div>
                        <div>• Usage analytics</div>
                        <div>• Security settings</div>
                      </div>
                    </div>
                  )}
                  
                  {selectedRole === 'manager' && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-blue-600">Manager Role</h3>
                      <p className="text-sm text-muted-foreground">
                        Team and project management capabilities with access to reports, sprint planning, and member management.
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>• Team member management</div>
                        <div>• Sprint planning tools</div>
                        <div>• Project reports & analytics</div>
                        <div>• Workload management</div>
                        <div>• Performance tracking</div>
                        <div>• Integration management</div>
                      </div>
                    </div>
                  )}
                  
                  {selectedRole === 'member' && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-green-600">Member Role</h3>
                      <p className="text-sm text-muted-foreground">
                        Active contributor with task management and personal productivity focus.
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>• Personal task management</div>
                        <div>• Project collaboration</div>
                        <div>• Sprint participation</div>
                        <div>• Personal reports</div>
                        <div>• Timeline viewing</div>
                        <div>• Team visibility</div>
                      </div>
                    </div>
                  )}
                  
                  {selectedRole === 'viewer' && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-gray-600">Viewer Role</h3>
                      <p className="text-sm text-muted-foreground">
                        Read-only access for stakeholders and observers with limited project visibility.
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>• Project overview access</div>
                        <div>• Read-only sprint boards</div>
                        <div>• Timeline viewing</div>
                        <div>• High-level reports</div>
                        <div>• Basic project information</div>
                        <div>• Progress tracking</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Implementation Features</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>✓ Dynamic role-based navigation</div>
                    <div>✓ Context-aware sidebar (workspace/project)</div>
                    <div>✓ Responsive design with mobile hamburger menu</div>
                    <div>✓ Collapsible sidebar with tooltips</div>
                    <div>✓ Active state highlighting</div>
                    <div>✓ Role badges and visual indicators</div>
                    <div>✓ Accessibility support</div>
                    <div>✓ Permission-based item filtering</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Integration Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Integration Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Using SidebarLayout</h4>
                <div className="bg-muted p-3 rounded text-xs font-mono">
                  <div>import &#123; SidebarLayout &#125; from '@/components/layout/SidebarLayout';</div>
                  <div className="mt-2">// Wrap your app content:</div>
                  <div>&lt;SidebarLayout&gt;</div>
                  <div>  &#123;children&#125;</div>
                  <div>&lt;/SidebarLayout&gt;</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Configuration</h4>
                <div className="bg-muted p-3 rounded text-xs font-mono">
                  <div>// Modify sidebar items in:</div>
                  <div>src/config/sidebarConfig.ts</div>
                  <div className="mt-2">// Add new roles or permissions</div>
                  <div>// Customize navigation structure</div>
                  <div>// Update role determination logic</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


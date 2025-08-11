'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Settings, 
  Save, 
  AlertTriangle, 
  Archive, 
  Trash2,
  Plus,
  X,
  Edit,
  Move,
  Workflow,
  Info,
  Shield,
  Users,
  Calendar,
  Tag
} from 'lucide-react';

// Static project settings data
const projectSettings = {
  general: {
    name: 'Mobile App Redesign',
    key: 'MAR',
    description: 'Complete overhaul of the mobile application user interface with modern design principles and improved user experience.',
    visibility: 'workspace',
    category: 'Product',
    startDate: '2024-01-01',
    targetEndDate: '2024-03-31',
    budget: 75000,
    currency: 'USD'
  },
  
  workflow: {
    statuses: [
      { id: '1', name: 'Backlog', color: '#6B7280', order: 1, category: 'todo' },
      { id: '2', name: 'To Do', color: '#3B82F6', order: 2, category: 'todo' },
      { id: '3', name: 'In Progress', color: '#F59E0B', order: 3, category: 'in_progress' },
      { id: '4', name: 'In Review', color: '#8B5CF6', order: 4, category: 'in_review' },
      { id: '5', name: 'Testing', color: '#EC4899', order: 5, category: 'in_review' },
      { id: '6', name: 'Done', color: '#10B981', order: 6, category: 'done' },
      { id: '7', name: 'Blocked', color: '#EF4444', order: 7, category: 'blocked' }
    ],
    
    taskTypes: [
      { id: '1', name: 'Story', icon: '📋', color: '#3B82F6' },
      { id: '2', name: 'Bug', icon: '🐛', color: '#EF4444' },
      { id: '3', name: 'Task', icon: '✅', color: '#10B981' },
      { id: '4', name: 'Epic', icon: '🚀', color: '#8B5CF6' },
      { id: '5', name: 'Spike', icon: '🔍', color: '#F59E0B' }
    ],
    
    priorities: [
      { id: '1', name: 'Lowest', color: '#6B7280' },
      { id: '2', name: 'Low', color: '#10B981' },
      { id: '3', name: 'Medium', color: '#F59E0B' },
      { id: '4', name: 'High', color: '#EF4444' },
      { id: '5', name: 'Highest', color: '#DC2626' }
    ]
  },

  notifications: {
    emailNotifications: true,
    slackIntegration: true,
    taskAssignments: true,
    statusChanges: true,
    comments: false,
    dueDates: true,
    sprintUpdates: true
  },

  permissions: {
    allowGuestAccess: false,
    requireApprovalForTasks: false,
    restrictTimeTracking: false,
    enableFileUploads: true,
    maxFileSize: 10, // MB
    allowedFileTypes: ['jpg', 'png', 'pdf', 'doc', 'docx', 'xls', 'xlsx']
  }
};

interface SettingsPageProps {
  params: {
    projectId: string;
  };
}

export default function SettingsPage({ params }: SettingsPageProps) {
  const [settings, setSettings] = useState(projectSettings);
  const [isEditing, setIsEditing] = useState(false);
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('#3B82F6');
  const [selectedCategory, setSelectedCategory] = useState('todo');

  const handleSaveGeneral = () => {
    // Save general settings logic
    console.log('Saving general settings:', settings.general);
    setIsEditing(false);
  };

  const handleAddStatus = () => {
    if (!newStatusName.trim()) return;
    
    const newStatus = {
      id: Date.now().toString(),
      name: newStatusName,
      color: newStatusColor,
      order: settings.workflow.statuses.length + 1,
      category: selectedCategory
    };
    
    setSettings(prev => ({
      ...prev,
      workflow: {
        ...prev.workflow,
        statuses: [...prev.workflow.statuses, newStatus]
      }
    }));
    
    setNewStatusName('');
    setNewStatusColor('#3B82F6');
    setSelectedCategory('todo');
  };

  const handleRemoveStatus = (statusId: string) => {
    setSettings(prev => ({
      ...prev,
      workflow: {
        ...prev.workflow,
        statuses: prev.workflow.statuses.filter(s => s.id !== statusId)
      }
    }));
  };

  const handleArchiveProject = () => {
    console.log('Archiving project:', params.projectId);
  };

  const handleDeleteProject = () => {
    console.log('Deleting project:', params.projectId);
  };

  const handleNotificationChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));
  };

  const handlePermissionChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Project Settings</h1>
          <p className="text-muted-foreground">
            Configure project details, workflows, and permissions
          </p>
        </div>
        <Button onClick={handleSaveGeneral} disabled={!isEditing} className="gap-2">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Project Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    value={settings.general.name}
                    onChange={(e) => {
                      setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, name: e.target.value }
                      }));
                      setIsEditing(true);
                    }}
                    placeholder="Enter project name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="key">Project Key</Label>
                  <Input
                    id="key"
                    value={settings.general.key}
                    onChange={(e) => {
                      setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, key: e.target.value.toUpperCase() }
                      }));
                      setIsEditing(true);
                    }}
                    placeholder="PROJECT_KEY"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Used for task IDs (e.g., {settings.general.key}-123)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={settings.general.description}
                  onChange={(e) => {
                    setSettings(prev => ({
                      ...prev,
                      general: { ...prev.general, description: e.target.value }
                    }));
                    setIsEditing(true);
                  }}
                  placeholder="Describe your project..."
                  rows={3}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select
                    value={settings.general.visibility}
                    onValueChange={(value) => {
                      setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, visibility: value }
                      }));
                      setIsEditing(true);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="workspace">Workspace Members</SelectItem>
                      <SelectItem value="team">Team Members Only</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={settings.general.category}
                    onValueChange={(value) => {
                      setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, category: value }
                      }));
                      setIsEditing(true);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Product">Product</SelectItem>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="Research">Research</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={settings.general.currency}
                    onValueChange={(value) => {
                      setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, currency: value }
                      }));
                      setIsEditing(true);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="JPY">JPY (¥)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={settings.general.startDate}
                    onChange={(e) => {
                      setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, startDate: e.target.value }
                      }));
                      setIsEditing(true);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Target End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={settings.general.targetEndDate}
                    onChange={(e) => {
                      setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, targetEndDate: e.target.value }
                      }));
                      setIsEditing(true);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget">Budget</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={settings.general.budget}
                    onChange={(e) => {
                      setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, budget: parseInt(e.target.value) }
                      }));
                      setIsEditing(true);
                    }}
                    placeholder="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflow Settings */}
        <TabsContent value="workflow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                Task Statuses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                {settings.workflow.statuses.map((status) => (
                  <div key={status.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: status.color }}
                      />
                      <span className="font-medium">{status.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {status.category.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRemoveStatus(status.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Status name"
                    value={newStatusName}
                    onChange={(e) => setNewStatusName(e.target.value)}
                    className="flex-1"
                  />
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="in_review">In Review</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                  <input
                    type="color"
                    value={newStatusColor}
                    onChange={(e) => setNewStatusColor(e.target.value)}
                    className="w-12 h-10 border rounded cursor-pointer"
                  />
                  <Button onClick={handleAddStatus} disabled={!newStatusName.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Task Types
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {settings.workflow.taskTypes.map((type) => (
                  <div key={type.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{type.icon}</span>
                      <span className="font-medium">{type.name}</span>
                    </div>
                    <div 
                      className="w-4 h-4 rounded" 
                      style={{ backgroundColor: type.color }}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Priority Levels
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {settings.workflow.priorities.map((priority) => (
                  <div key={priority.id} className="flex items-center justify-between p-2 border rounded">
                    <span className="font-medium">{priority.name}</span>
                    <div 
                      className="w-4 h-4 rounded" 
                      style={{ backgroundColor: priority.color }}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive project updates via email
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.emailNotifications}
                    onCheckedChange={(checked) => handleNotificationChange('emailNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Slack Integration</Label>
                    <p className="text-sm text-muted-foreground">
                      Send updates to connected Slack channels
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.slackIntegration}
                    onCheckedChange={(checked) => handleNotificationChange('slackIntegration', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Task Assignments</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify when tasks are assigned or reassigned
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.taskAssignments}
                    onCheckedChange={(checked) => handleNotificationChange('taskAssignments', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Status Changes</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify when task statuses are updated
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.statusChanges}
                    onCheckedChange={(checked) => handleNotificationChange('statusChanges', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Comments</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify about new comments on tasks
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.comments}
                    onCheckedChange={(checked) => handleNotificationChange('comments', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Due Dates</Label>
                    <p className="text-sm text-muted-foreground">
                      Remind about upcoming and overdue tasks
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.dueDates}
                    onCheckedChange={(checked) => handleNotificationChange('dueDates', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sprint Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify about sprint start, completion, and changes
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.sprintUpdates}
                    onCheckedChange={(checked) => handleNotificationChange('sprintUpdates', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions */}
        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Project Permissions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Guest Access</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow non-workspace members to view this project
                    </p>
                  </div>
                  <Switch
                    checked={settings.permissions.allowGuestAccess}
                    onCheckedChange={(checked) => handlePermissionChange('allowGuestAccess', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Approval for Tasks</Label>
                    <p className="text-sm text-muted-foreground">
                      New tasks must be approved before being added
                    </p>
                  </div>
                  <Switch
                    checked={settings.permissions.requireApprovalForTasks}
                    onCheckedChange={(checked) => handlePermissionChange('requireApprovalForTasks', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Restrict Time Tracking</Label>
                    <p className="text-sm text-muted-foreground">
                      Only managers can view and edit time logs
                    </p>
                  </div>
                  <Switch
                    checked={settings.permissions.restrictTimeTracking}
                    onCheckedChange={(checked) => handlePermissionChange('restrictTimeTracking', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable File Uploads</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow team members to upload files to tasks
                    </p>
                  </div>
                  <Switch
                    checked={settings.permissions.enableFileUploads}
                    onCheckedChange={(checked) => handlePermissionChange('enableFileUploads', checked)}
                  />
                </div>

                {settings.permissions.enableFileUploads && (
                  <div className="ml-6 space-y-4 p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="maxFileSize">Maximum File Size (MB)</Label>
                      <Input
                        id="maxFileSize"
                        type="number"
                        value={settings.permissions.maxFileSize}
                        onChange={(e) => handlePermissionChange('maxFileSize', parseInt(e.target.value))}
                        className="w-32"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Allowed File Types</Label>
                      <div className="flex flex-wrap gap-2">
                        {settings.permissions.allowedFileTypes.map((type) => (
                          <Badge key={type} variant="secondary">
                            .{type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Danger Zone */}
        <TabsContent value="danger" className="space-y-6">
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-orange-900">Archive Project</h4>
                      <p className="text-sm text-orange-700 mt-1">
                        Archive this project to hide it from active project lists. 
                        Archived projects can be restored later.
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100">
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Archive Project</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to archive "{settings.general.name}"? 
                            This will hide the project from active lists, but all data will be preserved 
                            and the project can be restored later.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleArchiveProject} className="bg-orange-600 hover:bg-orange-700">
                            Archive Project
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-red-900">Delete Project</h4>
                      <p className="text-sm text-red-700 mt-1">
                        Permanently delete this project and all associated data. 
                        This action cannot be undone.
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Project</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to permanently delete "{settings.general.name}"? 
                            This will remove all tasks, files, comments, and project history. 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive text-destructive-foreground">
                            Delete Project
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Need Help?</p>
                    <p className="text-sm text-muted-foreground">
                      If you're having issues with this project or need to transfer ownership, 
                      please contact your workspace administrator or reach out to support.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

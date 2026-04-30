import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAppSelector } from '../store';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Plus, Users, ListTodo, Trash2, Shield, UserMinus, Clock, Circle, CheckCircle2 } from 'lucide-react';

interface Member {
  id: string;
  role: string;
  user: { id: string; name: string; email: string };
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  assignee: { id: string; name: string } | null;
  createdBy: { id: string; name: string };
}

interface ProjectDetail {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  members: Member[];
  _count: { tasks: number };
}

const priorityColors: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  LOW: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

const statusConfig: Record<string, { label: string; icon: any; color: string; column: string }> = {
  TODO: { label: 'To Do', icon: Circle, color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', column: 'bg-gray-50 dark:bg-gray-800/50' },
  IN_PROGRESS: { label: 'In Progress', icon: Clock, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', column: 'bg-blue-50 dark:bg-blue-900/20' },
  DONE: { label: 'Done', icon: CheckCircle2, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', column: 'bg-green-50 dark:bg-green-900/20' },
};

export const ProjectDetailPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAppSelector((state) => state.auth);
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');

  // Create task state
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState('MEDIUM');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [taskCreating, setTaskCreating] = useState(false);

  // Invite member state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  const [error, setError] = useState('');

  const fetchProject = async () => {
    try {
      const res = await api.get(`/projects/${projectId}`);
      setProject(res.data.data);
    } catch (err) {
      console.error('Failed to fetch project:', err);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await api.get(`/projects/${projectId}/tasks`);
      setTasks(res.data.data);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  };

  useEffect(() => {
    const load = async () => {
      await Promise.all([fetchProject(), fetchTasks()]);
      setLoading(false);
    };
    load();
  }, [projectId]);

  const currentMembership = project?.members.find((m) => m.user.id === user?.id);
  const isAdmin = currentMembership?.role === 'ADMIN';

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setTaskCreating(true);
    try {
      await api.post(`/projects/${projectId}/tasks`, {
        title: taskTitle,
        description: taskDescription || undefined,
        priority: taskPriority,
        assigneeId: taskAssigneeId || undefined,
      });
      setTaskTitle('');
      setTaskDescription('');
      setTaskPriority('MEDIUM');
      setTaskAssigneeId('');
      setTaskDialogOpen(false);
      fetchTasks();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create task');
    } finally {
      setTaskCreating(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInviting(true);
    try {
      await api.post(`/projects/${projectId}/members`, { email: inviteEmail });
      setInviteEmail('');
      setInviteDialogOpen(false);
      fetchProject();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to invite member');
    } finally {
      setInviting(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await api.patch(`/tasks/${taskId}`, { status: newStatus });
      fetchTasks();
    } catch (err: any) {
      console.error('Failed to update task status:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      fetchTasks();
    } catch (err: any) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await api.delete(`/projects/${projectId}/members/${userId}`);
      fetchProject();
    } catch (err: any) {
      console.error('Failed to remove member:', err);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      await api.patch(`/projects/${projectId}/members/${userId}`, { role: newRole });
      fetchProject();
    } catch (err: any) {
      console.error('Failed to change role:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-96" />
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  if (!project) {
    return <div className="text-center py-20 text-gray-500">Project not found.</div>;
  }

  const todoTasks = tasks.filter((t) => t.status === 'TODO');
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS');
  const doneTasks = tasks.filter((t) => t.status === 'DONE');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
          {project.description && (
            <p className="text-gray-500 dark:text-gray-400 mt-1">{project.description}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tasks">
            <ListTodo className="h-4 w-4 mr-2" />
            Tasks ({tasks.length})
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Members ({project.members.length})
          </TabsTrigger>
        </TabsList>

        {/* ===== TASKS TAB ===== */}
        <TabsContent value="tasks" className="mt-6">
          <div className="flex justify-end mb-4">
            <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
              <DialogTrigger>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreateTask}>
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <DialogDescription>Add a task to this project.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {error && (
                      <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">{error}</div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="task-title">Title</Label>
                      <Input
                        id="task-title"
                        placeholder="e.g. Design homepage mockup"
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="task-desc">Description (optional)</Label>
                      <Textarea
                        id="task-desc"
                        placeholder="Add details..."
                        value={taskDescription}
                        onChange={(e) => setTaskDescription(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Priority</Label>
                        <Select value={taskPriority} onValueChange={(val) => val && setTaskPriority(val)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LOW">Low</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="HIGH">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Assignee</Label>
                        <Select value={taskAssigneeId} onValueChange={(val) => val && setTaskAssigneeId(val)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Unassigned" />
                          </SelectTrigger>
                          <SelectContent>
                            {project.members.map((m) => (
                              <SelectItem key={m.user.id} value={m.user.id}>
                                {m.user.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={taskCreating}>
                      {taskCreating ? 'Creating...' : 'Create Task'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Kanban Board */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['TODO', 'IN_PROGRESS', 'DONE'] as const).map((status) => {
              const config = statusConfig[status];
              const columnTasks = status === 'TODO' ? todoTasks : status === 'IN_PROGRESS' ? inProgressTasks : doneTasks;
              return (
                <div key={status} className={`rounded-lg p-4 ${config.column} min-h-[200px]`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                      <config.icon className="h-4 w-4 mr-2" />
                      {config.label}
                    </h3>
                    <Badge variant="secondary">{columnTasks.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {columnTasks.map((task) => (
                      <Card key={task.id} className="shadow-sm">
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-medium text-sm text-gray-900 dark:text-white">{task.title}</p>
                            {(isAdmin || task.createdBy.id === user?.id) && (
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Badge className={`text-xs ${priorityColors[task.priority]}`}>
                                {task.priority}
                              </Badge>
                              {task.assignee && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {task.assignee.name}
                                </span>
                              )}
                            </div>
                            {/* Status quick-change */}
                            <Select
                              value={task.status}
                              onValueChange={(val) => val && handleStatusChange(task.id, val)}
                            >
                              <SelectTrigger className="h-6 w-auto text-xs border-none shadow-none px-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="TODO">To Do</SelectItem>
                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                <SelectItem value="DONE">Done</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {columnTasks.length === 0 && (
                      <p className="text-xs text-center text-gray-400 py-4">No tasks</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* ===== MEMBERS TAB ===== */}
        <TabsContent value="members" className="mt-6">
          <div className="flex justify-end mb-4">
            {isAdmin && (
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleInvite}>
                    <DialogHeader>
                      <DialogTitle>Invite a Team Member</DialogTitle>
                      <DialogDescription>
                        Enter the email of a registered user to invite them.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {error && (
                        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">{error}</div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="invite-email">Email Address</Label>
                        <Input
                          id="invite-email"
                          type="email"
                          placeholder="teammate@example.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={inviting}>
                        {inviting ? 'Inviting...' : 'Send Invite'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="space-y-2">
            {project.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-300 font-semibold">
                    {member.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{member.user.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{member.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant={member.role === 'ADMIN' ? 'default' : 'secondary'}>
                    {member.role === 'ADMIN' && <Shield className="h-3 w-3 mr-1" />}
                    {member.role}
                  </Badge>
                  {isAdmin && member.user.id !== project.ownerId && (
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleChangeRole(member.user.id, member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN')
                        }
                      >
                        <Shield className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleRemoveMember(member.user.id)}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

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
import { z } from 'zod';

const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
});

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

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
  HIGH: 'bg-red-500/10 text-red-400 border border-red-500/20',
  MEDIUM: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  LOW: 'bg-green-500/10 text-green-400 border border-green-500/20',
};

const statusConfig: Record<string, { label: string; icon: any; color: string; column: string }> = {
  TODO: { label: 'To Do', icon: Circle, color: 'text-slate-400', column: 'bg-white/5 border border-white/10' },
  IN_PROGRESS: { label: 'In Progress', icon: Clock, color: 'text-blue-400', column: 'bg-blue-900/10 border border-blue-500/20' },
  DONE: { label: 'Done', icon: CheckCircle2, color: 'text-green-400', column: 'bg-green-900/10 border border-green-500/20' },
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
  const [taskFieldErrors, setTaskFieldErrors] = useState<Record<string, string>>({});

  // Invite member state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteFieldErrors, setInviteFieldErrors] = useState<Record<string, string>>({});

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
    setTaskFieldErrors({});
    setTaskCreating(true);

    try {
      taskSchema.parse({ title: taskTitle });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        err.issues.forEach((e: z.ZodIssue) => {
          if (e.path[0]) errors[e.path[0].toString()] = e.message;
        });
        setTaskFieldErrors(errors);
        setTaskCreating(false);
        return;
      }
    }

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
      if (err.response?.data?.error?.details) {
        const errors: Record<string, string> = {};
        err.response.data.error.details.forEach((e: any) => {
          if (e.path && e.path[0]) errors[e.path[0]] = e.message;
        });
        setTaskFieldErrors(errors);
      } else {
        setError(err.response?.data?.error?.message || 'Failed to create task');
      }
    } finally {
      setTaskCreating(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInviteFieldErrors({});
    setInviting(true);

    try {
      inviteSchema.parse({ email: inviteEmail });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        err.issues.forEach((e: z.ZodIssue) => {
          if (e.path[0]) errors[e.path[0].toString()] = e.message;
        });
        setInviteFieldErrors(errors);
        setInviting(false);
        return;
      }
    }

    try {
      await api.post(`/projects/${projectId}/members`, { email: inviteEmail });
      setInviteEmail('');
      setInviteDialogOpen(false);
      fetchProject();
    } catch (err: any) {
      if (err.response?.data?.error?.details) {
        const errors: Record<string, string> = {};
        err.response.data.error.details.forEach((e: any) => {
          if (e.path && e.path[0]) errors[e.path[0]] = e.message;
        });
        setInviteFieldErrors(errors);
      } else {
        setError(err.response?.data?.error?.message || 'Failed to invite member');
      }
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
    return <div className="text-center py-20 text-muted-foreground relative z-10">Project not found.</div>;
  }

  const todoTasks = tasks.filter((t) => t.status === 'TODO');
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS');
  const doneTasks = tasks.filter((t) => t.status === 'DONE');

  return (
    <div className="space-y-6 relative z-10">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground mt-2 tracking-tight text-lg">{project.description}</p>
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
                        className={taskFieldErrors.title ? 'border-red-500 focus-visible:ring-red-500' : ''}
                      />
                      {taskFieldErrors.title && <p className="text-xs text-red-500 mt-1">{taskFieldErrors.title}</p>}
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
                <div key={status} className={`rounded-xl p-4 ${config.column} min-h-[200px]`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`font-semibold tracking-tight flex items-center ${config.color}`}>
                      <config.icon className="h-4 w-4 mr-2" />
                      {config.label}
                    </h3>
                    <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/20">{columnTasks.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {columnTasks.map((task) => (
                      <Card key={task.id} className="shadow-lg hover:shadow-indigo-500/20 hover:border-indigo-500/50 cursor-pointer transition-all">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-medium text-sm text-foreground">{task.title}</p>
                            {(isAdmin || task.createdBy.id === user?.id) && (
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="text-muted-foreground hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Badge className={`text-[10px] uppercase tracking-wider ${priorityColors[task.priority]}`}>
                                {task.priority}
                              </Badge>
                              {task.assignee && (
                                <span className="text-xs text-muted-foreground font-medium">
                                  {task.assignee.name}
                                </span>
                              )}
                            </div>
                            {/* Status quick-change */}
                            <Select
                              value={task.status}
                              onValueChange={(val) => val && handleStatusChange(task.id, val)}
                              disabled={!isAdmin && task.createdBy.id !== user?.id && task.assignee?.id !== user?.id}
                            >
                              <SelectTrigger className="h-6 w-auto text-xs border border-white/10 bg-black/40 text-muted-foreground shadow-none px-2 rounded-md hover:bg-white/10 transition-colors disabled:opacity-50">
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
                      <p className="text-xs text-center text-muted-foreground py-6 opacity-50">No tasks</p>
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
                          className={inviteFieldErrors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
                        />
                        {inviteFieldErrors.email && <p className="text-xs text-red-500 mt-1">{inviteFieldErrors.email}</p>}
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
                className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-indigo-500/30 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-semibold shadow-inner">
                    {member.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-foreground tracking-tight">{member.user.name}</p>
                    <p className="text-sm text-muted-foreground">{member.user.email}</p>
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

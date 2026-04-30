import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Skeleton } from '../components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Plus, FolderKanban, Users, ListTodo } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count: { members: number; tasks: number };
}

export const ProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data.data);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      await api.post('/projects', { name, description: description || undefined });
      setName('');
      setDescription('');
      setDialogOpen(false);
      fetchProjects();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your team projects</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>Add a new project to organize your team's work.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {error && (
                  <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">{error}</div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    placeholder="e.g. Marketing Website"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-description">Description (optional)</Label>
                  <Textarea
                    id="project-description"
                    placeholder="What is this project about?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Project'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderKanban className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No projects yet</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm">
            Create your first project to start organizing tasks and collaborating with your team.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FolderKanban className="h-5 w-5 mr-2 text-blue-500" />
                    {project.name}
                  </CardTitle>
                  {project.description && (
                    <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {project._count.members} member{project._count.members !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center">
                      <ListTodo className="h-4 w-4 mr-1" />
                      {project._count.tasks} task{project._count.tasks !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

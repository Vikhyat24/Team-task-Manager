import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAppSelector } from '../store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { CheckCircle2, Circle, Clock, AlertTriangle, FolderKanban, Users, ListTodo } from 'lucide-react';

interface DashboardData {
  stats: {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
    overdue: number;
  };
  recentProjects: Array<{
    id: string;
    name: string;
    description: string | null;
    _count: { members: number; tasks: number };
  }>;
  myTasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string | null;
    project: { id: string; name: string };
  }>;
}

const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: number; icon: any; color: string }) => (
  <Card>
    <CardContent className="flex items-center p-6">
      <div className={`p-3 rounded-lg ${color} mr-4`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </CardContent>
  </Card>
);

const priorityColors: Record<string, string> = {
  HIGH: 'text-red-600 bg-red-50 dark:bg-red-900/30',
  MEDIUM: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30',
  LOW: 'text-green-600 bg-green-50 dark:bg-green-900/30',
};

const statusIcons: Record<string, React.ReactNode> = {
  TODO: <Circle className="h-4 w-4 text-gray-400" />,
  IN_PROGRESS: <Clock className="h-4 w-4 text-blue-500" />,
  DONE: <CheckCircle2 className="h-4 w-4 text-green-500" />,
};

export const Dashboard = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/dashboard');
        setData(response.data.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Here's what's happening across your projects.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Tasks" value={stats?.total ?? 0} icon={ListTodo} color="bg-blue-500" />
        <StatCard title="To Do" value={stats?.todo ?? 0} icon={Circle} color="bg-gray-500" />
        <StatCard title="In Progress" value={stats?.inProgress ?? 0} icon={Clock} color="bg-yellow-500" />
        <StatCard title="Done" value={stats?.done ?? 0} icon={CheckCircle2} color="bg-green-500" />
        <StatCard title="Overdue" value={stats?.overdue ?? 0} icon={AlertTriangle} color="bg-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FolderKanban className="h-5 w-5 mr-2" />
              Recent Projects
            </CardTitle>
            <CardDescription>Your most recently created projects</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.recentProjects && data.recentProjects.length > 0 ? (
              <div className="space-y-3">
                {data.recentProjects.map((project) => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{project.name}</p>
                      {project.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {project._count.members}
                      </span>
                      <span className="flex items-center">
                        <ListTodo className="h-4 w-4 mr-1" />
                        {project._count.tasks}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FolderKanban className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No projects yet</p>
                <p className="text-sm mt-1">Create a project to get started!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Open Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ListTodo className="h-5 w-5 mr-2" />
              My Open Tasks
            </CardTitle>
            <CardDescription>Tasks assigned to you that aren't done yet</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.myTasks && data.myTasks.length > 0 ? (
              <div className="space-y-2">
                {data.myTasks.map((task) => (
                  <Link
                    key={task.id}
                    to={`/projects/${task.project.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      {statusIcons[task.status]}
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">{task.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{task.project.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[task.priority]}`}>
                        {task.priority}
                      </span>
                      {task.dueDate && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">All caught up!</p>
                <p className="text-sm mt-1">No open tasks assigned to you.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

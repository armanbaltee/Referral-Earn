import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { taskApi, type TaskItem, type TaskEarnings, TaskCategory } from '../task.api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function TaskMarketplacePage(): React.ReactElement {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [earnings, setEarnings] = useState<TaskEarnings | null>(null);
  const [category, setCategory] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [category, search]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [taskRes, earnRes] = await Promise.all([
        taskApi.getAvailableTasks({
          category: category !== 'all' ? category : undefined,
          search: search || undefined,
        }),
        taskApi.getUserEarnings(),
      ]);
      setTasks(taskRes.tasks);
      setEarnings(earnRes);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPKR = (paisa: number) => `Rs. ${(paisa / 100).toLocaleString('en-PK')}`;

  const categoryLabels: Record<string, string> = {
    all: 'All Categories',
    [TaskCategory.WATCH_VIDEO]: 'Watch Videos',
    [TaskCategory.COMPLETE_TASK]: 'Assigned Tasks',
    [TaskCategory.PROMOTIONAL]: 'Promotional Activities',
    [TaskCategory.PRODUCT_RELATED]: 'Product Reviews',
    [TaskCategory.OTHER]: 'Special Tasks',
  };

  return (
    <div className="space-y-6">
      {/* Header & Earnings Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daily Tasks & Rewards</h1>
          <p className="text-sm text-muted-foreground">Complete sponsored activities, watch verified videos, and earn instant cash rewards.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link to="/tasks/submissions">My Submissions</Link>
          </Button>
        </div>
      </div>

      {/* User Stats Card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Total Task Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-primary">{formatPKR(earnings?.totalEarnedPaisa || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Credited directly to available wallet balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Completed Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-600">{earnings?.completedTasksCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Approved & rewarded submissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-500">{earnings?.pendingTasksCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Submissions currently undergoing verification</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {Object.entries(categoryLabels).map(([key, label]) => (
            <Button
              key={key}
              variant={category === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategory(key)}
            >
              {label}
            </Button>
          ))}
        </div>
        <div className="w-full sm:w-64">
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Task Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="text-base font-semibold">No tasks available in this category.</p>
            <p className="text-sm mt-1">Check back later for fresh daily earning opportunities!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <Card key={task._id} className="flex flex-col justify-between hover:border-primary/50 transition">
              <div>
                {task.thumbnail && (
                  <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
                    <img src={task.thumbnail} alt={task.title} className="h-full w-full object-cover" />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="capitalize text-xs">
                      {task.category.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">~{task.estimatedMinutes} min</span>
                  </div>
                  <CardTitle className="text-base font-bold mt-2 line-clamp-1">{task.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {task.description}
                  </p>
                </CardContent>
              </div>

              <div className="p-6 pt-0">
                <div className="flex items-center justify-between py-3 border-t">
                  <span className="text-xs text-muted-foreground font-medium">Cash Reward:</span>
                  <span className="text-lg font-black text-emerald-600">{formatPKR(task.rewardAmount)}</span>
                </div>
                <Button className="w-full" asChild>
                  <Link to={`/tasks/${task._id}`}>Start & Submit Task &rarr;</Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type TaskStats = {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
};

type ProjectTaskStatsCardProps = {
  taskStats: TaskStats;
};

export const ProjectTaskStatsCard = ({ taskStats }: ProjectTaskStatsCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Task Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Completion</span>
            <span className="text-muted-foreground">
              {taskStats.total > 0
                ? Math.round((taskStats.done / taskStats.total) * 100)
                : 0}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div
              className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
              style={{
                width: `${taskStats.total > 0 ? (taskStats.done / taskStats.total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center justify-between py-2.5 px-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-slate-500" />
              <span className="text-sm font-medium">To Do</span>
            </div>
            <Badge
              variant="secondary"
              className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              {taskStats.todo}
            </Badge>
          </div>
          <div className="flex items-center justify-between py-2.5 px-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-orange-500" />
              <span className="text-sm font-medium">In Progress</span>
            </div>
            <Badge
              variant="secondary"
              className="bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300"
            >
              {taskStats.inProgress}
            </Badge>
          </div>
          <div className="flex items-center justify-between py-2.5 px-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-600" />
              <span className="text-sm font-medium">Completed</span>
            </div>
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
            >
              {taskStats.done}
            </Badge>
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between pt-2 px-3 py-2.5 bg-primary/10 rounded-lg">
          <span className="text-sm font-semibold">Total Tasks</span>
          <Badge className="bg-primary text-primary-foreground font-semibold">
            {taskStats.total}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

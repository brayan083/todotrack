import { Clock, Coffee, DollarSign, TrendingUp } from "lucide-react";

type DurationParts = {
  hours: number;
  minutes: number;
  seconds: number;
};

type TimesheetStatsProps = {
  totalParts: DurationParts;
  avgDailyParts: DurationParts;
  percentBillable: number;
  percentChange: number | null;
  activeProjectCount: number;
  projectsLength: number;
  activeProjectRatio: number;
};

export const TimesheetStats = ({
  totalParts,
  avgDailyParts,
  percentBillable,
  percentChange,
  activeProjectCount,
  projectsLength,
  activeProjectRatio,
}: TimesheetStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between relative overflow-hidden group shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative z-10">
          <p className="text-sm font-medium text-muted-foreground mb-1">Total Hours</p>
          <h3 className="text-3xl font-bold">
            {totalParts.hours}
            <span className="text-lg text-muted-foreground font-normal">h</span>{" "}
            {totalParts.minutes}
            <span className="text-lg text-muted-foreground font-normal">m</span>{" "}
            {totalParts.seconds}
            <span className="text-lg text-muted-foreground font-normal">s</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            {percentChange === null ? (
              "No data last week"
            ) : (
              <>
                <TrendingUp className="h-3 w-3" />
                {percentChange >= 0 ? "+" : ""}
                {percentChange.toFixed(1)}% vs last week
              </>
            )}
          </p>
        </div>
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary relative z-10">
          <Clock className="h-6 w-6" />
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">Daily Average</p>
          <h3 className="text-3xl font-bold">
            {avgDailyParts.hours}
            <span className="text-lg text-muted-foreground font-normal">h</span>{" "}
            {avgDailyParts.minutes}
            <span className="text-lg text-muted-foreground font-normal">m</span>{" "}
            {avgDailyParts.seconds}
            <span className="text-lg text-muted-foreground font-normal">s</span>
          </h3>
          <div className="w-32 h-1 bg-secondary rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-green-500" style={{ width: `${percentBillable}%` }}></div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {percentBillable.toFixed(1)}% billable
          </p>
        </div>
        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
          <DollarSign className="h-6 w-6" />
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">Active Projects</p>
          <h3 className="text-3xl font-bold">
            {activeProjectCount}
            <span className="text-lg text-muted-foreground font-normal"> / {projectsLength}</span>
          </h3>
          <div className="w-32 h-1 bg-secondary rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-orange-500" style={{ width: `${activeProjectRatio}%` }}></div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">In this range</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
          <Coffee className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

import { Button } from "@/components/ui/button";

type TimesheetHeaderProps = {
  onCreateEntry: () => void;
};

export const TimesheetHeader = ({
  onCreateEntry,
}: TimesheetHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold mb-1">Timesheet History</h1>
        <p className="text-muted-foreground text-sm">
          Review your tracked hours and manage entries.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button className="hidden md:flex gap-2" onClick={onCreateEntry}>
          <span>New Entry</span>
        </Button>
      </div>
    </div>
  );
};

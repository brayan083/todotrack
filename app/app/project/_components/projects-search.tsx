import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type ProjectsSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export const ProjectsSearch = ({ value, onChange }: ProjectsSearchProps) => {
  return (
    <div className="mb-6">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          className="pl-9"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </div>
  );
};

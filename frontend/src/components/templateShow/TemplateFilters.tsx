// components/templates/TemplateFilters.tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TemplateFilterOptions, Topic } from "@/types";

interface TemplateFiltersProps {
  filters: TemplateFilterOptions;
  onFilterChange: (key: keyof TemplateFilterOptions, value: any) => void;
  topics: Topic[];
  showTopicFilter?: boolean;
  showStatusFilter?: boolean;
  showVisibilityFilter?: boolean;
}

export default function TemplateFilters({ filters, onFilterChange, topics = [], showTopicFilter = true, showStatusFilter = true, showVisibilityFilter = true }: TemplateFiltersProps) {
  return (
    <div className="mt-4 p-4 border rounded-md grid grid-cols-1 md:grid-cols-3 gap-4">
      {showTopicFilter && (
        <div>
          <label className="text-sm font-medium">Topic</label>
          <Select
            value={filters.topicId?.toString() || ""}
            onValueChange={(value) => {
              onFilterChange("topicId", value === "all" ? undefined : parseInt(value));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All topics" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All topics</SelectItem>
              {topics.map((topic) => (
                <SelectItem key={topic.id} value={topic.id.toString()}>
                  {topic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {showStatusFilter && (
        <div>
          <label className="text-sm font-medium">Status</label>
          <Select
            value={filters.isPublished?.toString() || ""}
            onValueChange={(value) => {
              onFilterChange("isPublished", value === "all" ? undefined : value === "true");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="true">Published</SelectItem>
              <SelectItem value="false">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {showVisibilityFilter && (
        <div>
          <label className="text-sm font-medium">Visibility</label>
          <Select
            value={filters.isPublic?.toString() || ""}
            onValueChange={(value) => {
              onFilterChange("isPublic", value === "all" ? undefined : value === "true");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All visibility</SelectItem>
              <SelectItem value="true">Public</SelectItem>
              <SelectItem value="false">Private</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

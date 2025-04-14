import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LoadingSpinner from "@/components/global/LoadingSpinner";
import { useDebounce } from "use-debounce";
import { useTopics, useSearchTopics } from "@/hooks/useTopics";

type TopicSelectorProps = {
  value: string | null;
  onChange: (value: number) => void;
  className?: string;
};

export const TopicSelector = ({ value, onChange, className }: TopicSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  // Fetch all topics initially
  const {
    data: topicsData,
    isLoading: isLoadingTopics,
    isError: isTopicsError,
    error: topicsError,
  } = useTopics({
    page: 1,
    limit: 100, // Adjust based on your needs
    sortBy: "name",
    sortOrder: "asc",
  });

  // Search for topics when there's a search query
  const { data: searchResults, isLoading: isLoadingSearch, isError: isSearchError } = useSearchTopics(debouncedSearchQuery);

  // Determine which data to display
  const displayTopics = debouncedSearchQuery ? searchResults || [] : topicsData?.topics || [];
  const isLoading = isLoadingTopics || (debouncedSearchQuery && isLoadingSearch);
  const isError = isTopicsError || isSearchError;
  const errorMessage = topicsError?.message || "Error loading topics";

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="topic">Topic *</Label>
      {isLoading ? (
        <div className="flex items-center gap-2">
          <LoadingSpinner />
          <span className="text-sm text-muted-foreground">Loading topics...</span>
        </div>
      ) : isError ? (
        <div className="text-sm text-red-500">
          {errorMessage}
          <button onClick={() => window.location.reload()} className="ml-2 text-sm underline">
            Retry
          </button>
        </div>
      ) : (
        <Select value={value?.toString() || ""} onValueChange={(val) => onChange(parseInt(val))}>
          <SelectTrigger id="topic" className="w-full">
            <SelectValue placeholder="Select a topic" />
          </SelectTrigger>
          <SelectContent>
            <div className="px-2 py-1">
              <input type="text" placeholder="Search topics..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full rounded border px-2 py-1 text-sm" />
            </div>

            {displayTopics.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">{debouncedSearchQuery ? "No matching topics found" : "No topics available"}</div>
            ) : (
              displayTopics.map((topic) => (
                <SelectItem key={topic.id} value={topic.id.toString()}>
                  {topic.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

// components/TopicSelector.tsx
import { useEffect, useState } from "react";
import { useTopicsStore, Topic } from "@/store/topicStore";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LoadingSpinner from "@/components/global/LoadingSpinner";
import { useAuth } from "@clerk/clerk-react";

import { useDebounce } from "use-debounce";

type TopicSelectorProps = {
  value: number | null;
  onChange: (value: number) => void;
  className?: string;
};

export const TopicSelector = ({ value, onChange, className }: TopicSelectorProps) => {
  const { getToken } = useAuth();
  const { topics, isLoading, isError, errorMessage, fetchTopics, searchTopics } = useTopicsStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  // Fetch topics on mount and when search query changes
  useEffect(() => {
    if (debouncedSearchQuery) {
      searchTopics(debouncedSearchQuery, getToken);
    } else {
      fetchTopics(getToken);
    }
  }, [debouncedSearchQuery, fetchTopics, searchTopics, getToken]);

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="topic">Topic</Label>
      {isLoading ? (
        <div className="flex items-center gap-2">
          <LoadingSpinner />
          <span className="text-sm text-muted-foreground">Loading topics...</span>
        </div>
      ) : isError ? (
        <div className="text-sm text-red-500">
          Error loading topics: {errorMessage}
          <button onClick={() => fetchTopics(getToken)} className="ml-2 text-sm underline">
            Retry
          </button>
        </div>
      ) : (
        <>
          <Select value={value?.toString() || ""} onValueChange={(val) => onChange(parseInt(val))}>
            <SelectTrigger id="topic" className="w-full">
              <SelectValue placeholder="Select a topic" />
            </SelectTrigger>
            <SelectContent>
              {/* Search input */}
              <div className="px-2 py-1">
                <input type="text" placeholder="Search topics..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full rounded border px-2 py-1 text-sm" />
              </div>

              {/* Topics list */}
              {topics.length === 0 ? (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">No topics found</div>
              ) : (
                topics.map((topic: Topic) => (
                  <SelectItem key={topic.id} value={topic.id.toString()}>
                    {topic.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </>
      )}
    </div>
  );
};

import { useState, useEffect, useRef } from "react";

interface Tag {
  id: string;
  name: string;
}
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTagsStore } from "@/store/tagStore";
import { useAuth } from "@clerk/clerk-react";

interface TagInputProps {
  value?: string[];
  onChange: (tags: string[]) => void;
}

export function TagInput({ value = [], onChange }: TagInputProps) {
  const { getToken } = useAuth();
  const { searchTags } = useTagsStore();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchTags = async () => {
      if (!inputValue.trim()) {
        setAvailableTags([]);
        return;
      }

      setIsLoading(true);
      try {
        const tags = await searchTags(inputValue, getToken);
        const filteredTags = tags.filter((tag) => !value.includes(tag.name)).map((tag) => ({ ...tag, id: String(tag.id) }));
        setAvailableTags(filteredTags);
      } catch (error) {
        console.error("Failed to fetch tags:", error);
        setAvailableTags([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchTags, 300);
    return () => clearTimeout(timeoutId);
  }, [inputValue, value, searchTags, getToken]);

  const handleAddTag = (tag: string) => {
    if (!value.includes(tag)) {
      onChange([...value, tag]);
      setInputValue("");
      inputRef.current?.focus();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputValue.trim() && availableTags.length === 0) {
      e.preventDefault();
      handleAddTag(inputValue.trim());
      setOpen(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-sm">
            {tag}
            <button type="button" className="ml-2 rounded-full outline-none focus:ring-2 focus:ring-ring" onClick={() => handleRemoveTag(tag)}>
              <X className="h-3 w-3" />
              <span className="sr-only">Remove {tag}</span>
            </button>
          </Badge>
        ))}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
            {inputValue || "Add tags..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Search tags..." value={inputValue} onValueChange={setInputValue} ref={inputRef} onKeyDown={handleKeyDown} />
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </div>
            ) : (
              <>
                <CommandEmpty>{inputValue && <div className="p-2 text-sm">No tags found. Press Enter to create "{inputValue}"</div>}</CommandEmpty>
                <CommandGroup>
                  {availableTags.map((tag) => (
                    <CommandItem
                      key={tag.id}
                      value={tag.name}
                      onSelect={() => {
                        handleAddTag(tag.name);
                        setOpen(false);
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", value.includes(tag.name) ? "opacity-100" : "opacity-0")} />
                      {tag.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

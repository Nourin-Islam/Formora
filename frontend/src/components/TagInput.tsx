import { useState, useEffect, useRef } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";

// Define Tag type
interface Tag {
  id: string;
  name: string;
}

// Define props for the component
interface TagInputProps {
  value?: string[];
  onChange: (tags: string[]) => void;
}

export function TagInput({ value = [], onChange }: TagInputProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch matching tags when input changes
  useEffect(() => {
    const fetchTags = async () => {
      if (!inputValue.trim()) {
        setAvailableTags([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await axios.get<Tag[]>(`/api/tags/search?q=${inputValue}`);
        const filteredTags = response.data.filter((tag) => !value.includes(tag.name));
        setAvailableTags(filteredTags);
      } catch (error) {
        console.error("Failed to fetch tags:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchTags, 300);
    return () => clearTimeout(timeoutId);
  }, [inputValue, value]);

  const handleAddTag = (tag: string) => {
    if (!value.includes(tag) && tag.trim() !== "") {
      onChange([...value, tag]);
      setInputValue("");
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-sm">
            {tag}
            <Button variant="ghost" size="sm" className="h-auto w-auto p-0 ml-2" onClick={() => handleRemoveTag(tag)}>
              <X className="h-3 w-3" />
              <span className="sr-only">Remove {tag}</span>
            </Button>
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
        <PopoverContent className="p-0 w-full">
          <Command>
            <CommandInput placeholder="Search tags..." value={inputValue} onValueChange={setInputValue} ref={inputRef} className="h-9" />
            {isLoading ? (
              <div className="py-6 text-center text-sm">Loading tags...</div>
            ) : (
              <>
                <CommandEmpty>
                  {inputValue.trim() !== "" && (
                    <div className="py-3 px-2">
                      <p>No tags found. Press Enter to create "{inputValue}"</p>
                      <Button variant="ghost" className="mt-2 w-full justify-start" onClick={() => handleAddTag(inputValue.trim())}>
                        <Check className="mr-2 h-4 w-4" />
                        Create "{inputValue.trim()}"
                      </Button>
                    </div>
                  )}
                </CommandEmpty>
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
            <div className="border-t px-2 py-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  if (inputValue.trim()) {
                    handleAddTag(inputValue.trim());
                    setOpen(false);
                  }
                }}
              >
                Press Enter to add "{inputValue || "..."}"
              </Button>
            </div>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

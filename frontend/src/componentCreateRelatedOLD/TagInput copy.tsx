import { useState, useRef } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchTags } from "@/hooks/useTags";
import { useCreateTag } from "@/hooks/useTags";
import { toast } from "sonner";

interface TagInputProps {
  value?: string[];
  onChange: (tags: string[]) => void;
}

export function TagInput({ value = [], onChange }: TagInputProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Search tags hook
  const { data: availableTags = [], isLoading, isError } = useSearchTags(inputValue);

  // Create tag hook
  const { mutateAsync: createTag } = useCreateTag();

  const filteredTags = availableTags.filter((tag) => !value.includes(tag.name));

  const handleAddTag = async (tag: string) => {
    if (!value.includes(tag)) {
      onChange([...value, tag]);
      setInputValue("");
      inputRef.current?.focus();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputValue.trim() && filteredTags.length === 0) {
      e.preventDefault();
      // .min(2, "Tag name must be at least 2 characters long")
      // .max(20, "Tag name cannot exceed 20 characters")
      // .regex(/^[a-zA-Z0-9 ]*$/, "Tag name can only contain letters, numbers, and spaces"),
      if (inputValue.length < 2) {
        // alert("Tag name must be at least 2 characters long");
        toast.error("Tag name must be at least 2 characters long");
        return;
      } else if (inputValue.length > 20) {
        // alert("Tag name cannot exceed 20 characters");
        toast.error("Tag name cannot exceed 20 characters");
        return;
      } else if (!/^[a-zA-Z0-9 ]*$/.test(inputValue)) {
        // alert("Tag name can only contain letters, numbers, and spaces");
        toast.error("Tag name can only contain letters, numbers, and spaces");
        return;
      }

      try {
        // Create new tag if it doesn't exist
        await createTag({ name: inputValue.trim() });
        handleAddTag(inputValue.trim());
      } catch (error) {
        console.error("Failed to create tag:", error);
      }
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
            ) : isError ? (
              <div className="p-2 text-sm text-red-500">Failed to load tags</div>
            ) : (
              <>
                <CommandEmpty>{inputValue && <div className="p-2 text-sm">No tags found. Press Enter to create "{inputValue}"</div>}</CommandEmpty>
                <CommandGroup>
                  {filteredTags.map((tag) => (
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

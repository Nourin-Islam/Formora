import { useState } from "react";
import { useDebounce } from "use-debounce";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ChevronsUpDown } from "lucide-react";
import { useUsers } from "@/hooks/useUsers";
import { User } from "@/types";
import { useTranslation } from "react-i18next";

interface UserSelectorProps {
  selectedUsers: User[];
  onChange: (users: User[]) => void;
  excludeUsers?: number[];
}

export function UserSelector({ selectedUsers = [], onChange, excludeUsers = [] }: UserSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "email">("name");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  const { t } = useTranslation("common");

  // Use the useUsers hook with search parameters
  const {
    data: searchResults,
    isLoading,
    isError,
    error,
  } = useUsers({
    page: 1,
    limit: 10,
    email: debouncedSearchTerm || undefined,
    sortBy,
    sortOrder: "asc",
  });

  const handleSelectUser = (user: User) => {
    onChange([...selectedUsers, user]);
    setSearchTerm("");
    setOpen(false);
  };

  const handleRemoveUser = (userId: number) => {
    onChange(selectedUsers.filter((user) => user.id !== userId));
  };

  // Filter out already selected and excluded users
  const filteredSearchResults = (searchResults?.users || []).filter((user) => !selectedUsers.some((selected) => selected.id === user.id) && !excludeUsers.includes(user.id));

  const sortedSelectedUsers = [...selectedUsers].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }
    // @ts-ignore
    return a.email.localeCompare(b.email);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium">{t("common.userSelector.Selected Users")}</h4>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">{t("common.userSelector.Sort by:")}</span>
          <Button
            variant={sortBy === "name" ? "default" : "outline"}
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              setSortBy("name");
            }}
          >
            {t("common.userSelector.Name")}
          </Button>
          <Button
            variant={sortBy === "email" ? "default" : "outline"}
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              setSortBy("email");
            }}
          >
            {t("common.userSelector.Email")}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {sortedSelectedUsers.length === 0 ? (
          <p className="text-sm text-gray-500">{t("common.userSelector.No users selected")}</p>
        ) : (
          sortedSelectedUsers.map((user) => (
            <Badge key={user.id} variant="secondary" className="text-sm flex items-center">
              {sortBy === "name" ? user.name : user.email}
              <Button variant="ghost" size="sm" className="h-auto w-auto p-0 ml-2" onClick={() => handleRemoveUser(user.id)}>
                <X className="h-3 w-3" />
                <span className="sr-only">
                  {t("common.userSelector.Remove")} {user.name}
                </span>
              </Button>
            </Badge>
          ))
        )}
      </div>

      {isError && (
        <div className="text-sm text-red-500">
          {t("common.userSelector.Error loading users")}: {error?.message}
          <button onClick={() => window.location.reload()} className="ml-2 text-sm underline">
            {t("common.userSelector.Retry")}
          </button>
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between" disabled={isLoading}>
            {isLoading ? t("common.userSelector.Loading...") : searchTerm || t("common.userSelector.Search users...")}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-full">
          <Command shouldFilter={false}>
            <CommandInput placeholder={t("common.userSelector.Search by name or email...")} value={searchTerm} onValueChange={setSearchTerm} />
            {isLoading ? (
              <div className="py-6 text-center text-sm">{t("common.userSelector.Searching users...")}</div>
            ) : (
              <>
                <CommandEmpty>{searchTerm ? t("common.userSelector.No users found") : t("common.userSelector.Start typing to search users")}</CommandEmpty>
                <CommandGroup>
                  {filteredSearchResults.map((user) => (
                    <CommandItem key={user.id} value={user.id.toString()} onSelect={() => handleSelectUser(user)}>
                      <div className="flex flex-col">
                        <span>{user.name}</span>
                        <span className="text-xs text-gray-500">{user.email}</span>
                      </div>
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

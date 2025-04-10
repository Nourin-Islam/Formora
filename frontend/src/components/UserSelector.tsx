import { useState, useEffect } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Check, ChevronsUpDown } from "lucide-react";
import axios from "axios";

type User = {
  id: string;
  name: string;
  email: string;
};

interface UserSelectorProps {
  selectedUsers: User[];
  onChange: (users: User[]) => void;
}

export function UserSelector({ selectedUsers = [], onChange }: UserSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "email">("name");

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchTerm.trim()) {
        setUsers([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await axios.get<User[]>(`/api/users/search?q=${searchTerm}`);
        const filteredUsers = response.data.filter((user) => !selectedUsers.some((selected) => selected.id === user.id));
        setUsers(filteredUsers);
      } catch (error) {
        console.error("Failed to search users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedUsers]);

  const handleSelectUser = (user: User) => {
    onChange([...selectedUsers, user]);
    setSearchTerm("");
  };

  const handleRemoveUser = (userId: string) => {
    onChange(selectedUsers.filter((user) => user.id !== userId));
  };

  const sortedSelectedUsers = [...selectedUsers].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }
    return a.email.localeCompare(b.email);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium">Selected Users</h4>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">Sort by:</span>
          <Button variant={sortBy === "name" ? "default" : "outline"} size="sm" onClick={() => setSortBy("name")}>
            Name
          </Button>
          <Button variant={sortBy === "email" ? "default" : "outline"} size="sm" onClick={() => setSortBy("email")}>
            Email
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {sortedSelectedUsers.length === 0 ? (
          <p className="text-sm text-gray-500">No users selected</p>
        ) : (
          sortedSelectedUsers.map((user) => (
            <Badge key={user.id} variant="secondary" className="text-sm flex items-center">
              {sortBy === "name" ? user.name : user.email}
              <Button variant="ghost" size="sm" className="h-auto w-auto p-0 ml-2" onClick={() => handleRemoveUser(user.id)}>
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {user.name}</span>
              </Button>
            </Badge>
          ))
        )}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
            {searchTerm || "Search users..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-full">
          <Command>
            <CommandInput placeholder="Search by name or email..." value={searchTerm} onValueChange={setSearchTerm} />
            {isLoading ? (
              <div className="py-6 text-center text-sm">Searching users...</div>
            ) : (
              <>
                <CommandEmpty>
                  <p className="p-2 text-sm">No users found</p>
                </CommandEmpty>
                <CommandGroup>
                  {users.map((user) => (
                    <CommandItem
                      key={user.id}
                      value={user.id}
                      onSelect={() => {
                        handleSelectUser(user);
                        setOpen(false);
                      }}
                    >
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

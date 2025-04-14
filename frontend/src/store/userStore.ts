// stores/userStore.ts
import { create } from "zustand";
import { z } from "zod";

export type User = {
  id: number;
  name: string;
  email: string;
  isAdmin?: boolean;
  isBlocked?: boolean;
};

export type UsersResponse = {
  users: User[];
  totalPages: number;
  totalCount: number;
};

// Form schema for user creation/editing
export const userFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  isAdmin: z.boolean().optional(),
  isBlocked: z.boolean().optional(),
});

interface UsersState {
  // Data
  users: User[];
  totalPages: number;
  totalCount: number;
  searchResults: User[];

  // UI State
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  isUpdating: boolean;

  // Selected user for edit/delete
  currentUser: User | null;

  // Filtering, sorting and pagination
  emailFilter: string;
  sorting: { id: string; desc: boolean }[];
  pagination: { pageIndex: number; pageSize: number };
  rowSelection: Record<string, boolean>;

  // Dialog states
  isCreateDialogOpen: boolean;
  isEditDialogOpen: boolean;
  isDeleteDialogOpen: boolean;

  // Actions
  setEmailFilter: (filter: string) => void;
  setSorting: (sorting: { id: string; desc: boolean }[]) => void;
  setPagination: (pagination: { pageIndex: number; pageSize: number }) => void;
  setRowSelection: (selection: Record<string, boolean>) => void;
  resetRowSelection: () => void;

  setCurrentUser: (user: User | null) => void;
  openCreateDialog: () => void;
  openEditDialog: (user: User) => void;
  openDeleteDialog: (user?: User) => void;
  closeAllDialogs: () => void;

  fetchUsers: (getToken: () => Promise<string | null>) => Promise<void>;
  createUser: (values: z.infer<typeof userFormSchema>, getToken: () => Promise<string | null>) => Promise<boolean>;
  updateUser: (values: z.infer<typeof userFormSchema>, getToken: () => Promise<string | null>) => Promise<boolean>;
  deleteUser: (userId: number, getToken: () => Promise<string | null>) => Promise<boolean>;
  bulkDeleteUsers: (userIds: number[], getToken: () => Promise<string | null>) => Promise<boolean>;

  // For autocomplete/search functionality
  searchUsers: (query: string, getToken: () => Promise<string | null>) => Promise<User[]>;
}

export const useUsersStore = create<UsersState>((set, get) => ({
  // Initial state
  users: [],
  totalPages: 1,
  totalCount: 0,
  searchResults: [],

  isLoading: false,
  isError: false,
  errorMessage: null,
  isUpdating: false,

  currentUser: null,

  emailFilter: "",
  sorting: [{ id: "name", desc: false }],
  pagination: { pageIndex: 0, pageSize: 10 },
  rowSelection: {},

  isCreateDialogOpen: false,
  isEditDialogOpen: false,
  isDeleteDialogOpen: false,

  // Setters
  setEmailFilter: (filter) => set({ emailFilter: filter }),
  setSorting: (sorting) => set({ sorting }),
  setPagination: (pagination) => set({ pagination }),
  setRowSelection: (selection) => set({ rowSelection: selection }),
  resetRowSelection: () => set({ rowSelection: {} }),

  setCurrentUser: (user) => set({ currentUser: user }),
  openCreateDialog: () =>
    set({
      isCreateDialogOpen: true,
      isEditDialogOpen: false,
      isDeleteDialogOpen: false,
      currentUser: null,
    }),
  openEditDialog: (user) =>
    set({
      isCreateDialogOpen: false,
      isEditDialogOpen: true,
      isDeleteDialogOpen: false,
      currentUser: user,
    }),
  openDeleteDialog: (user) =>
    set({
      isCreateDialogOpen: false,
      isEditDialogOpen: false,
      isDeleteDialogOpen: true,
      currentUser: user || null,
    }),
  closeAllDialogs: () =>
    set({
      isCreateDialogOpen: false,
      isEditDialogOpen: false,
      isDeleteDialogOpen: false,
    }),

  // API actions
  fetchUsers: async (getToken) => {
    const { pagination, sorting, emailFilter } = get();

    set({ isLoading: true, isError: false, errorMessage: null });

    try {
      const token = await getToken();

      const params = new URLSearchParams({
        page: (pagination.pageIndex + 1).toString(),
        limit: pagination.pageSize.toString(),
        sortBy: sorting[0]?.id || "name",
        sortOrder: sorting[0]?.desc ? "desc" : "asc",
        ...(emailFilter && { email: emailFilter }),
      });

      const response = await fetch(`http://localhost:3000/api/users?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to fetch users");
      }

      const data = await response.json();
      set({
        users: data.users,
        totalPages: data.totalPages,
        totalCount: data.totalCount,
        isLoading: false,
      });
    } catch (error) {
      set({
        isError: true,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  createUser: async (values, getToken) => {
    set({ isUpdating: true });

    try {
      const token = await getToken();
      const response = await fetch("http://localhost:3000/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error("Failed to create user");

      // Refetch users to update the list
      await get().fetchUsers(getToken);
      set({ isCreateDialogOpen: false, isUpdating: false });
      return true;
    } catch (error) {
      set({ isUpdating: false });
      return false;
    }
  },

  updateUser: async (values, getToken) => {
    const { currentUser } = get();
    if (!currentUser) return false;

    set({ isUpdating: true });

    try {
      const token = await getToken();
      const response = await fetch(`/api/users/${currentUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error("Failed to update user");

      // Refetch users to update the list
      await get().fetchUsers(getToken);
      set({ isEditDialogOpen: false, currentUser: null, isUpdating: false });
      return true;
    } catch (error) {
      set({ isUpdating: false });
      return false;
    }
  },

  deleteUser: async (userId, getToken) => {
    set({ isUpdating: true });

    try {
      const token = await getToken();
      const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete user");

      // Refetch users to update the list
      await get().fetchUsers(getToken);
      set({ isDeleteDialogOpen: false, currentUser: null, isUpdating: false });
      return true;
    } catch (error) {
      set({ isUpdating: false });
      return false;
    }
  },

  bulkDeleteUsers: async (userIds, getToken) => {
    if (userIds.length === 0) {
      set({ isDeleteDialogOpen: false });
      return true;
    }

    set({ isUpdating: true });

    try {
      const token = await getToken();
      await Promise.all(
        userIds.map(async (userId) => {
          const response = await fetch(`/api/users/${userId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (!response.ok) throw new Error(`Failed to delete user ${userId}`);
        })
      );

      // Refetch users to update the list
      await get().fetchUsers(getToken);
      set({ isDeleteDialogOpen: false, rowSelection: {}, isUpdating: false });
      return true;
    } catch (error) {
      set({ isUpdating: false });
      return false;
    }
  },

  // For autocomplete functionality
  searchUsers: async (query, getToken) => {
    console.log("Searching users with query:", query);
    if (!query.trim()) {
      set({ searchResults: [] });
      return [];
    }

    set({ isLoading: true });

    try {
      const token = await getToken();

      const response = await fetch(`http://localhost:3000/api/users/search?q=${encodeURIComponent(query)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to search users");
      }

      const data = await response.json();

      set({ searchResults: data, isLoading: false });
      return data;
    } catch (error) {
      console.error("Error searching users:", error);
      set({ isLoading: false, searchResults: [] });
      return [];
    }
  },
}));

// store/useTagsStore.ts
import { create } from "zustand";
import { z } from "zod";

// Define the Tag type
export type Tag = {
  id: number;
  name: string;
};

export type TagsResponse = {
  tags: Tag[];
  totalPages: number;
  hasNextPage: boolean;
};

// Form schema for tag creation/editing
export const tagFormSchema = z.object({
  name: z.string().min(2, {
    message: "Tag name must be at least 2 characters.",
  }),
});

interface TagsState {
  // Data
  tags: Tag[];
  totalPages: number;
  hasNextPage: boolean;

  // UI State
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  isUpdating: boolean;

  // Selected tag for edit/delete
  currentTag: Tag | null;

  // Filtering, sorting and pagination
  nameFilter: string;
  sorting: { id: string; desc: boolean }[];
  pagination: { pageIndex: number; pageSize: number };
  rowSelection: Record<string, boolean>;

  // Dialog states
  isCreateDialogOpen: boolean;
  isEditDialogOpen: boolean;
  isDeleteDialogOpen: boolean;

  // Actions
  setNameFilter: (filter: string) => void;
  setSorting: (sorting: { id: string; desc: boolean }[]) => void;
  setPagination: (pagination: { pageIndex: number; pageSize: number }) => void;
  setRowSelection: (selection: Record<string, boolean>) => void;
  resetRowSelection: () => void;

  setCurrentTag: (tag: Tag | null) => void;
  openCreateDialog: () => void;
  openEditDialog: (tag: Tag) => void;
  openDeleteDialog: (tag?: Tag) => void;
  closeAllDialogs: () => void;

  fetchTags: (getToken: () => Promise<string | null>) => Promise<void>;
  createTag: (values: z.infer<typeof tagFormSchema>, getToken: () => Promise<string | null>) => Promise<boolean>;
  updateTag: (values: z.infer<typeof tagFormSchema>, getToken: () => Promise<string | null>) => Promise<boolean>;
  deleteTag: (tagId: number, getToken: () => Promise<string | null>) => Promise<boolean>;
  bulkDeleteTags: (tagIds: number[], getToken: () => Promise<string | null>) => Promise<boolean>;

  // For autocomplete/search functionality
  searchTags: (query: string, getToken: () => Promise<string | null>) => Promise<Tag[]>;
}

export const useTagsStore = create<TagsState>((set, get) => ({
  // Initial state
  tags: [],
  totalPages: 1,
  hasNextPage: false,

  isLoading: false,
  isError: false,
  errorMessage: null,
  isUpdating: false,

  currentTag: null,

  nameFilter: "",
  sorting: [{ id: "name", desc: false }],
  pagination: { pageIndex: 0, pageSize: 5 },
  rowSelection: {},

  isCreateDialogOpen: false,
  isEditDialogOpen: false,
  isDeleteDialogOpen: false,

  // Setters
  setNameFilter: (filter) => set({ nameFilter: filter }),
  setSorting: (sorting) => set({ sorting }),
  setPagination: (pagination) => set({ pagination }),
  setRowSelection: (selection) => set({ rowSelection: selection }),
  resetRowSelection: () => set({ rowSelection: {} }),

  setCurrentTag: (tag) => set({ currentTag: tag }),
  openCreateDialog: () =>
    set({
      isCreateDialogOpen: true,
      isEditDialogOpen: false,
      isDeleteDialogOpen: false,
      currentTag: null,
    }),
  openEditDialog: (tag) =>
    set({
      isCreateDialogOpen: false,
      isEditDialogOpen: true,
      isDeleteDialogOpen: false,
      currentTag: tag,
    }),
  openDeleteDialog: (tag) =>
    set({
      isCreateDialogOpen: false,
      isEditDialogOpen: false,
      isDeleteDialogOpen: true,
      currentTag: tag || null,
    }),
  closeAllDialogs: () =>
    set({
      isCreateDialogOpen: false,
      isEditDialogOpen: false,
      isDeleteDialogOpen: false,
    }),

  // API actions
  fetchTags: async (getToken) => {
    const { pagination, sorting, nameFilter } = get();

    set({ isLoading: true, isError: false, errorMessage: null });

    try {
      const token = await getToken();

      const params = new URLSearchParams({
        page: (pagination.pageIndex + 1).toString(),
        limit: pagination.pageSize.toString(),
        sortBy: sorting[0]?.id || "name",
        sortOrder: sorting[0]?.desc ? "desc" : "asc",
        ...(nameFilter && { name: nameFilter }),
      });

      const response = await fetch(`http://localhost:3000/api/tags?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to fetch tags");
      }

      const data = await response.json();
      set({
        tags: data.tags,
        totalPages: data.totalPages,
        hasNextPage: data.hasNextPage,
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

  createTag: async (values, getToken) => {
    set({ isUpdating: true });

    try {
      const token = await getToken();
      const response = await fetch("http://localhost:3000/api/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error("Failed to create tag");

      // Refetch tags to update the list
      await get().fetchTags(getToken);
      set({ isCreateDialogOpen: false, isUpdating: false });
      return true;
    } catch (error) {
      set({ isUpdating: false });
      return false;
    }
  },

  updateTag: async (values, getToken) => {
    const { currentTag } = get();
    if (!currentTag) return false;

    set({ isUpdating: true });

    try {
      const token = await getToken();
      const response = await fetch(`http://localhost:3000/api/tags/${currentTag.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error("Failed to update tag");

      // Refetch tags to update the list
      await get().fetchTags(getToken);
      set({ isEditDialogOpen: false, currentTag: null, isUpdating: false });
      return true;
    } catch (error) {
      set({ isUpdating: false });
      return false;
    }
  },

  deleteTag: async (tagId, getToken) => {
    set({ isUpdating: true });

    try {
      const token = await getToken();
      const response = await fetch(`http://localhost:3000/api/tags/${tagId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete tag");

      // Refetch tags to update the list
      await get().fetchTags(getToken);
      set({ isDeleteDialogOpen: false, currentTag: null, isUpdating: false });
      return true;
    } catch (error) {
      set({ isUpdating: false });
      return false;
    }
  },

  bulkDeleteTags: async (tagIds, getToken) => {
    if (tagIds.length === 0) {
      set({ isDeleteDialogOpen: false });
      return true;
    }

    set({ isUpdating: true });

    try {
      const token = await getToken();
      await Promise.all(
        tagIds.map(async (tagId) => {
          const response = await fetch(`http://localhost:3000/api/tags/${tagId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (!response.ok) throw new Error(`Failed to delete tag ${tagId}`);
        })
      );

      // Refetch tags to update the list
      await get().fetchTags(getToken);
      set({ isDeleteDialogOpen: false, rowSelection: {}, isUpdating: false });
      return true;
    } catch (error) {
      set({ isUpdating: false });
      return false;
    }
  },

  // For autocomplete functionality
  searchTags: async (query, getToken) => {
    console.log("Searching tags with query:", query);
    try {
      const token = await getToken();

      if (!query.trim()) {
        return []; // Return early for empty queries
      }

      const response = await fetch(`http://localhost:3000/api/tags/search?q=${encodeURIComponent(query)}&limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Search error:", error);
      return []; // Always return an array
    }
  },
}));

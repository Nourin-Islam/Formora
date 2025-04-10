import { create } from "zustand";
import { z } from "zod";

// Define the Topic type
export type Topic = {
  id: number;
  name: string;
};

export type TopicsResponse = {
  topics: Topic[];
  totalPages: number;
  hasNextPage: boolean;
};

// Form schema for topic creation/editing
export const topicFormSchema = z.object({
  name: z.string().min(2, {
    message: "Topic name must be at least 2 characters.",
  }),
});

interface TopicsState {
  // Data
  topics: Topic[];
  totalPages: number;
  hasNextPage: boolean;

  // UI State
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  isUpdating: boolean;

  // Selected topic for edit/delete
  currentTopic: Topic | null;

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

  setCurrentTopic: (topic: Topic | null) => void;
  openCreateDialog: () => void;
  openEditDialog: (topic: Topic) => void;
  openDeleteDialog: (topic?: Topic) => void;
  closeAllDialogs: () => void;

  fetchTopics: (getToken: () => Promise<string | null>) => Promise<void>;
  createTopic: (values: z.infer<typeof topicFormSchema>, getToken: () => Promise<string | null>) => Promise<boolean>;
  updateTopic: (values: z.infer<typeof topicFormSchema>, getToken: () => Promise<string | null>) => Promise<boolean>;
  deleteTopic: (topicId: number, getToken: () => Promise<string | null>) => Promise<boolean>;
  bulkDeleteTopics: (topicIds: number[], getToken: () => Promise<string | null>) => Promise<boolean>;

  // For autocomplete/search functionality
  searchTopics: (query: string, getToken: () => Promise<string | null>) => Promise<Topic[]>;
}

export const useTopicsStore = create<TopicsState>((set, get) => ({
  // Initial state
  topics: [],
  totalPages: 1,
  hasNextPage: false,

  isLoading: false,
  isError: false,
  errorMessage: null,
  isUpdating: false,

  currentTopic: null,

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

  setCurrentTopic: (topic) => set({ currentTopic: topic }),
  openCreateDialog: () =>
    set({
      isCreateDialogOpen: true,
      isEditDialogOpen: false,
      isDeleteDialogOpen: false,
      currentTopic: null,
    }),
  openEditDialog: (topic) =>
    set({
      isCreateDialogOpen: false,
      isEditDialogOpen: true,
      isDeleteDialogOpen: false,
      currentTopic: topic,
    }),
  openDeleteDialog: (topic) =>
    set({
      isCreateDialogOpen: false,
      isEditDialogOpen: false,
      isDeleteDialogOpen: true,
      currentTopic: topic || null,
    }),
  closeAllDialogs: () =>
    set({
      isCreateDialogOpen: false,
      isEditDialogOpen: false,
      isDeleteDialogOpen: false,
    }),

  // API actions
  fetchTopics: async (getToken) => {
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

      const response = await fetch(`http://localhost:3000/api/topics?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to fetch topics");
      }

      const data = await response.json();
      set({
        topics: data.topics,
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

  createTopic: async (values, getToken) => {
    set({ isUpdating: true });

    try {
      const token = await getToken();
      const response = await fetch("http://localhost:3000/api/topics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error("Failed to create topic");

      // Refetch topics to update the list
      await get().fetchTopics(getToken);
      set({ isCreateDialogOpen: false, isUpdating: false });
      return true;
    } catch (error) {
      set({ isUpdating: false });
      return false;
    }
  },

  updateTopic: async (values, getToken) => {
    const { currentTopic } = get();
    if (!currentTopic) return false;

    set({ isUpdating: true });

    try {
      const token = await getToken();
      const response = await fetch(`http://localhost:3000/api/topics/${currentTopic.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error("Failed to update topic");

      // Refetch topics to update the list
      await get().fetchTopics(getToken);
      set({ isEditDialogOpen: false, currentTopic: null, isUpdating: false });
      return true;
    } catch (error) {
      set({ isUpdating: false });
      return false;
    }
  },

  deleteTopic: async (topicId, getToken) => {
    set({ isUpdating: true });

    try {
      const token = await getToken();
      const response = await fetch(`http://localhost:3000/api/topics/${topicId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete topic");

      // Refetch topics to update the list
      await get().fetchTopics(getToken);
      set({ isDeleteDialogOpen: false, currentTopic: null, isUpdating: false });
      return true;
    } catch (error) {
      set({ isUpdating: false });
      return false;
    }
  },

  bulkDeleteTopics: async (topicIds, getToken) => {
    if (topicIds.length === 0) {
      set({ isDeleteDialogOpen: false });
      return true;
    }

    set({ isUpdating: true });

    try {
      const token = await getToken();
      await Promise.all(
        topicIds.map(async (topicId) => {
          const response = await fetch(`http://localhost:3000/api/topics/${topicId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (!response.ok) throw new Error(`Failed to delete topic ${topicId}`);
        })
      );

      // Refetch topics to update the list
      await get().fetchTopics(getToken);
      set({ isDeleteDialogOpen: false, rowSelection: {}, isUpdating: false });
      return true;
    } catch (error) {
      set({ isUpdating: false });
      return false;
    }
  },

  // For autocomplete functionality
  searchTopics: async (query, getToken) => {
    try {
      const token = await getToken();

      const params = new URLSearchParams({
        q: query,
        limit: "10",
      });

      const response = await fetch(`http://localhost:3000/api/topics/search?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to search topics");
      }

      return await response.json();
    } catch (error) {
      console.error("Error searching topics:", error);
      return [];
    }
  },
}));

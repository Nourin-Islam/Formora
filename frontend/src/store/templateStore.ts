// stores/templateStore.ts
import { create } from "zustand";
import axios from "axios";

export interface Template {
  id: string;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  // Add any additional fields as needed
}

interface TemplateStore {
  templates: Template[];
  currentTemplate: Template | null;
  isLoading: boolean;
  error: string | null;

  fetchTemplates: () => Promise<void>;
  fetchTemplateById: (id: string) => Promise<Template>;
  createTemplate: (templateData: Partial<Template>) => Promise<Template>;
  updateTemplate: (id: string, templateData: Partial<Template>) => Promise<Template>;
  deleteTemplate: (id: string) => Promise<void>;
}

export const useTemplateStore = create<TemplateStore>((set, get) => ({
  templates: [],
  currentTemplate: null,
  isLoading: false,
  error: null,

  fetchTemplates: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get<Template[]>("/api/templates");
      set({ templates: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || "Failed to fetch templates", isLoading: false });
    }
  },

  fetchTemplateById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get<Template>(`/api/templates/${id}`);
      set({ currentTemplate: response.data, isLoading: false });
      return response.data;
    } catch (error: any) {
      set({ error: error.message || "Failed to fetch template", isLoading: false });
      throw error;
    }
  },

  createTemplate: async (templateData: Partial<Template>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post<Template>("/api/templates", templateData);
      set((state) => ({
        templates: [...state.templates, response.data],
        isLoading: false,
      }));
      return response.data;
    } catch (error: any) {
      set({ error: error.message || "Failed to create template", isLoading: false });
      throw error;
    }
  },

  updateTemplate: async (id: string, templateData: Partial<Template>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put<Template>(`/api/templates/${id}`, templateData);
      set((state) => ({
        templates: state.templates.map((template) => (template.id === id ? response.data : template)),
        currentTemplate: response.data,
        isLoading: false,
      }));
      return response.data;
    } catch (error: any) {
      set({ error: error.message || "Failed to update template", isLoading: false });
      throw error;
    }
  },

  deleteTemplate: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await axios.delete(`/api/templates/${id}`);
      set((state) => ({
        templates: state.templates.filter((template) => template.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || "Failed to delete template", isLoading: false });
      throw error;
    }
  },
}));

// stores/templateStore.ts
import { create } from "zustand";
import axios from "axios";

import { Template, Question, TemplateFormData } from "../types";

interface TemplateStore {
  templates: Template[];
  currentTemplate: Template | null;
  isLoading: boolean;
  error: string | null;

  fetchTemplates: () => Promise<void>;
  fetchTemplateById: (id: string) => Promise<Template>;
  createTemplate: (templateData: TemplateFormData, getToken: () => Promise<string | null>) => Promise<Template>;
  updateTemplate: (id: string, templateData: Partial<Template>) => Promise<Template>;
  deleteTemplate: (id: string) => Promise<void>;

  // Question-specific actions
  createQuestion: (templateId: string, questionData: Omit<Question, "id">) => Promise<Question>;
  updateQuestion: (questionId: string, questionData: Partial<Question>) => Promise<Question>;
  deleteQuestion: (questionId: string) => Promise<void>;
  reorderQuestions: (templateId: string, questionOrder: string[]) => Promise<void>;
}

export const useTemplateStore = create<TemplateStore>((set, get) => ({
  templates: [],
  currentTemplate: null,
  isLoading: false,
  error: null,

  fetchTemplates: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get<Template[]>("http://localhost:3000/api/templates");
      set({ templates: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || "Failed to fetch templates", isLoading: false });
    }
  },

  fetchTemplateById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get<Template>(`http://localhost:3000/api/templates/${id}`);

      // Fetch questions for this template
      const questionsResponse = await axios.get<Question[]>(`http://localhost:3000/api/questions/template/${id}`);

      const templateWithQuestions = {
        ...response.data,
        questions: questionsResponse.data,
      };

      set({ currentTemplate: templateWithQuestions, isLoading: false });
      return templateWithQuestions;
    } catch (error: any) {
      set({ error: error.message || "Failed to fetch template", isLoading: false });
      throw error;
    }
  },

  createTemplate: async (templateData, getToken) => {
    set({ isLoading: true, error: null });
    try {
      // ,
      // headers: {
      //   "Content-Type": "application/json",
      //   Authorization: `Bearer ${token}`,
      // },

      // const response = await axios.post("http://localhost:3000/api/templates", templateData);
      const token = await getToken();
      const response = await axios.post<Template>("http://localhost:3000/api/templates", templateData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      // const response = await fetch("http://localhost:3000/api/templates", {
      const newTemplate = response.data;
      console.log("New Template Created:", newTemplate);

      set((state) => ({
        templates: [...state.templates, newTemplate],
        currentTemplate: newTemplate,
        isLoading: false,
      }));

      return newTemplate;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateTemplate: async (id: string, templateData: Partial<Template>) => {
    set({ isLoading: true, error: null });
    try {
      // Extract questions if present
      const { questions, ...templateDetails } = templateData;

      // Update the template details
      const response = await axios.put<Template>(`http://localhost:3000/api/templates/${id}`, templateDetails);

      // Handle question updates if included
      if (questions) {
        // Get existing questions
        const existingQuestionsResponse = await axios.get<Question[]>(`http://localhost:3000/api/questions/template/${id}`);
        const existingQuestions = existingQuestionsResponse.data;

        // Identify questions to create, update, or delete
        const existingIds = existingQuestions.map((q) => q.id);
        const newIds = questions.map((q) => q.id);

        // Questions to create (don't have an ID or ID not in existing)
        const questionsToCreate = questions.filter((q) => !q.id || !existingIds.includes(q.id));

        // Questions to update (have an ID that exists in current questions)
        const questionsToUpdate = questions.filter((q) => q.id && existingIds.includes(q.id));

        // Questions to delete (exist in current but not in updated list)
        const questionsToDelete = existingQuestions.filter((q) => !newIds.includes(q.id));

        // Perform creates
        for (const question of questionsToCreate) {
          await axios.post("http://localhost:3000/api/questions", {
            ...question,
            templateId: id,
          });
        }

        // Perform updates
        for (const question of questionsToUpdate) {
          await axios.put(`http://localhost:3000/api/questions/${question.id}`, question);
        }

        // Perform deletes
        for (const question of questionsToDelete) {
          await axios.delete(`http://localhost:3000/api/questions/${question.id}`);
        }
      }

      // Fetch the updated template with questions
      const updatedTemplate = await get().fetchTemplateById(id);

      set((state) => ({
        templates: state.templates.map((template) => (template.id === Number(id) ? updatedTemplate : template)),
        currentTemplate: updatedTemplate,
        isLoading: false,
      }));

      return updatedTemplate;
    } catch (error: any) {
      set({ error: error.message || "Failed to update template", isLoading: false });
      throw error;
    }
  },

  deleteTemplate: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await axios.delete(`http://localhost:3000/api/templates/${id}`);
      set((state) => ({
        templates: state.templates.filter((template) => template.id !== Number(id)),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || "Failed to delete template", isLoading: false });
      throw error;
    }
  },

  // Question-specific actions
  createQuestion: async (templateId: string, questionData: Omit<Question, "id">) => {
    try {
      const response = await axios.post<Question>("http://localhost:3000/api/questions", {
        ...questionData,
        templateId,
      });

      // Update current template if this is for the current template
      if (get().currentTemplate?.id === Number(templateId)) {
        const currentTemplate = get().currentTemplate;
        const updatedQuestions = [...(currentTemplate?.questions || []), response.data];

        set({
          currentTemplate: {
            ...currentTemplate!,
            questions: updatedQuestions,
          },
        });
      }

      return response.data;
    } catch (error: any) {
      throw new Error(error.message || "Failed to create question");
    }
  },

  updateQuestion: async (questionId: string, questionData: Partial<Question>) => {
    try {
      const response = await axios.put<Question>(`http://localhost:3000/api/questions/${questionId}`, questionData);

      // Update current template if it contains this question
      const currentTemplate = get().currentTemplate;
      if (currentTemplate?.questions?.some((q) => q.id === questionId)) {
        const updatedQuestions = currentTemplate.questions.map((q) => (q.id === questionId ? response.data : q));

        set({
          currentTemplate: {
            ...currentTemplate,
            questions: updatedQuestions,
          },
        });
      }

      return response.data;
    } catch (error: any) {
      throw new Error(error.message || "Failed to update question");
    }
  },

  deleteQuestion: async (questionId: string) => {
    try {
      await axios.delete(`http://localhost:3000/api/questions/${questionId}`);

      // Update current template if it contains this question
      const currentTemplate = get().currentTemplate;
      if (currentTemplate?.questions?.some((q) => q.id === questionId)) {
        const updatedQuestions = currentTemplate.questions.filter((q) => q.id !== questionId);

        set({
          currentTemplate: {
            ...currentTemplate,
            questions: updatedQuestions,
          },
        });
      }
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete question");
    }
  },

  reorderQuestions: async (templateId: string, questionOrder: string[]) => {
    try {
      await axios.post("http://localhost:3000/api/questions/reorder", {
        templateId,
        questionOrder,
      });

      // Update the question order in current template if this is for the current template
      const currentTemplate = get().currentTemplate;
      if (currentTemplate?.id === Number(templateId) && currentTemplate?.questions) {
        // Create a new array with questions in the specified order
        const questionsMap = new Map(currentTemplate.questions.map((q) => [q.id, q]));

        const orderedQuestions = questionOrder.map((id) => questionsMap.get(id)).filter((q) => q !== undefined) as Question[];

        // Update positions based on new order
        const updatedQuestions = orderedQuestions.map((q, index) => ({
          ...q,
          position: index,
        }));

        set({
          currentTemplate: {
            ...currentTemplate,
            questions: updatedQuestions,
          },
        });
      }
    } catch (error: any) {
      throw new Error(error.message || "Failed to reorder questions");
    }
  },
}));

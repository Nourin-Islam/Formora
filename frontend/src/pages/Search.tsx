// pages/SearchPage.tsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Filter } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@clerk/clerk-react";

import { TemplateFilterOptions, Template } from "@/types";
import { useLikeTemplate, useUnlikeTemplate } from "@/hooks/useTemplateInteractions";
import { useDeleteTemplate } from "@/hooks/useTemplates";
import { useTopics } from "@/hooks/useTopics";
import { publicApi } from "@/lib/api";

// Import our new common components
import TemplateList from "@/components/templateShow/TemplateList";
import TemplateFilters from "@/components/templateShow/TemplateFilters";
import { useTranslation } from "react-i18next";

export default function SearchPage() {
  const { t } = useTranslation();
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query") || "";

  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TemplateFilterOptions>({
    page: 1,
    limit: 6,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Add state for filters UI
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [totalPages, setTotalPages] = useState<number>(0);

  // Fetch topics for filter dropdown
  const { data: topicsData } = useTopics({});
  const topics = topicsData?.topics || [];

  // Fetch search results when query or filters change
  const fetchSearchResults = async () => {
    if (!query) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await publicApi.get("/search", {
        params: {
          q: query,
          ...filters,
        },
      });
      setTemplates(response.data.templates || []);
      setTotalPages(response.data.totalPages || 0);
    } catch (err) {
      setError("Failed to load search results");
      console.error("Search error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSearchResults();
  }, [query, filters]);

  // Template mutations
  const likeMutation = useLikeTemplate([["templates", filters], ["popular-templates"]]);
  const unlikeMutation = useUnlikeTemplate([["templates", filters], ["popular-templates"]]);

  const addLike = (id: number) => likeMutation.mutate(id);
  const removeLike = (id: number) => unlikeMutation.mutate(id);
  const { mutate: deleteTemplate, isPending: isDeleting } = useDeleteTemplate();

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleFilterChange = (key: keyof TemplateFilterOptions, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page on filter change
    }));
  };

  const handleLike = (templateId: number) => {
    if (!userId) {
      toast.info(t("Please sign in to like templates"));
      return;
    }

    setTemplates((prev) =>
      prev.map((template) => {
        if (template.id === templateId) {
          return {
            ...template,
            likesCount: template.likesCount + 1,
            peopleLiked: [...template.peopleLiked, userId],
          };
        }
        return template;
      })
    );

    addLike(templateId);
  };

  const handleUnLike = (templateId: number) => {
    if (!userId) {
      toast.info(t("Please sign in to unlike templates"));
      return;
    }

    setTemplates((prev) =>
      prev.map((template) => {
        if (template.id === templateId) {
          return {
            ...template,
            likesCount: template.likesCount - 1,
            peopleLiked: template.peopleLiked.filter((id) => id !== userId),
          };
        }
        return template;
      })
    );

    removeLike(templateId);
  };

  const handleEditTemplate = (id: number) => {
    navigate(`/manage-template/${id}`);
  };

  const handleViewTemplate = (id: number) => {
    navigate(`/check-form/${id}`);
  };

  const handleDeleteTemplate = (templateId: number, options?: { onSuccess?: () => void }) => {
    deleteTemplate(templateId, {
      onSuccess: () => {
        toast.success(t("Template deleted successfully"));
        if (options?.onSuccess) options.onSuccess();
        fetchSearchResults(); // Refresh the list
      },
      onError: (error) => {
        console.error("Error deleting template:", error);
        toast.error(t("Failed to delete template"));
      },
    });
  };

  const createNewTemplate = () => {
    navigate("/create-template");
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {t("Search Results for")} "{query}"
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            {t("Filters")}
          </Button>
          <Button onClick={createNewTemplate}>
            <Plus className="mr-2 h-4 w-4" /> {t("Create Template")}
          </Button>
        </div>
      </div>

      {showFilters && <TemplateFilters filters={filters} onFilterChange={handleFilterChange} topics={topics} />}

      <TemplateList templates={templates} isLoading={isLoading} isError={!!error} userId={userId ?? null} filters={filters} totalPages={totalPages} onPageChange={handlePageChange} onRefetch={fetchSearchResults} onLike={handleLike} onUnlike={handleUnLike} onView={handleViewTemplate} onEdit={handleEditTemplate} onDelete={handleDeleteTemplate} isDeleting={isDeleting} emptyStateMessage={`${t("No templates found matching")} "${query}"`} createButtonText={t("Create a new template")} />
    </div>
  );
}

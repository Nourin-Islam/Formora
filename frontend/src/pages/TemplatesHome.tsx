// pages/TemplatesHome.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Filter } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@clerk/clerk-react";

import { TemplateFilterOptions } from "@/types";
import { useTopics } from "@/hooks/useTopics";
import { useTemplates, useDeleteTemplate } from "@/hooks/useTemplates";
import { useLikeTemplate, useUnlikeTemplate } from "@/hooks/useTemplateInteractions";

// Import our new common components
import TemplateList from "@/components/templateShow/TemplateList";
import TemplateFilters from "@/components/templateShow/TemplateFilters";

export default function TemplatesHome() {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<TemplateFilterOptions>({
    page: 1,
    limit: 6,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Fetch topics for filter dropdown
  const { data: topicsData } = useTopics({});
  const topics = topicsData?.topics || [];

  // Fetch templates with filters
  const { data: templatesData, isLoading, isError, refetch } = useTemplates(filters);
  const templates = templatesData?.templates || [];
  const totalPages = templatesData?.totalPages || 1;

  // Template mutations
  const { mutate: addLike } = useLikeTemplate(filters);
  const { mutate: removeLike } = useUnlikeTemplate(filters);
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
      toast.info("Please sign in to like templates");
      return;
    }

    addLike(templateId, {
      onSuccess: () => {
        toast.success("Successfully added a like.");
        // setTimeout(() => {
        //   refetch();
        // }, 1000);
      },
      onError: (error) => {
        console.error("Error toggling like:", error);
        toast.error("Failed to update like status");
      },
    });
  };

  const handleUnLike = (templateId: number) => {
    if (!userId) {
      toast.info("Please sign in to unlike templates");
      return;
    }

    removeLike(templateId, {
      onSuccess: () => {
        toast.success("Successfully removed a like.");
        // setTimeout(() => {
        //   refetch();
        // }, 1000);
      },
      onError: (error) => {
        console.error("Error toggling like:", error);
        toast.error("Failed to update like status");
      },
    });
  };

  const handleEditTemplate = (id: number) => {
    navigate(`/edit-template/${id}`);
  };

  const handleViewTemplate = (id: number) => {
    navigate(`/fill-form/${id}`);
  };

  const handleDeleteTemplate = (templateId: number, options?: { onSuccess?: () => void }) => {
    deleteTemplate(templateId, {
      onSuccess: () => {
        toast.success("Template deleted successfully");
        if (options?.onSuccess) options.onSuccess();
        refetch();
      },
      onError: (error) => {
        console.error("Error deleting template:", error);
        toast.error("Failed to delete template");
      },
    });
  };

  const createNewTemplate = () => {
    navigate("/create-template");
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Templates</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button onClick={createNewTemplate}>
            <Plus className="mr-2 h-4 w-4" /> Create Template
          </Button>
        </div>
      </div>

      {showFilters && <TemplateFilters filters={filters} onFilterChange={handleFilterChange} topics={topics} />}

      <TemplateList templates={templates} isLoading={isLoading} isError={isError} userId={userId ?? null} filters={filters} totalPages={totalPages} onPageChange={handlePageChange} onRefetch={refetch} onLike={handleLike} onUnlike={handleUnLike} onView={handleViewTemplate} onEdit={handleEditTemplate} onDelete={handleDeleteTemplate} isDeleting={isDeleting} emptyStateMessage="No templates found" createButtonText="Create your first template" />
    </div>
  );
}

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Import our new common components
import TemplateList from "@/components/templateShow/TemplateList";
import TemplateFilters from "@/components/templateShow/TemplateFilters";
import { useTranslation } from "react-i18next";
import UserAllResponses from "@/components/UserAllResponses";
import useSEO from "@/hooks/useSEO";
import SalesforceSyncForm from "@/components/SalesforceSyncForm";

export default function TemplatesHome() {
  useSEO({
    title: "Formora: My Templates",
    description: "Manage your templates and submissions.",
    keywords: "privacy, data protection, Formora",
  });
  const { t } = useTranslation("common");
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("templates");
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
  const { data: templatesData, isLoading, isError, error, refetch } = useTemplates(filters);
  const templates = templatesData?.templates || [];
  const totalPages = templatesData?.totalPages || 1;

  // Template mutations
  // const { mutate: addLike } = useLikeTemplate(filters);
  // const { mutate: removeLike } = useUnlikeTemplate(filters);
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
      toast.info(t("common.thome.Please sign in to like templates"));
      return;
    }

    addLike(templateId);
  };

  const handleUnLike = (templateId: number) => {
    if (!userId) {
      toast.info(t("common.thome.Please sign in to unlike templates"));
      return;
    }

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
        toast.success(t("common.thome.Template deleted successfully"));
        if (options?.onSuccess) options.onSuccess();
        refetch();
      },
      onError: (error) => {
        console.error("Error deleting template:", error);
        toast.error(t("common.thome.Failed to delete template"));
      },
    });
  };

  const createNewTemplate = () => {
    navigate("/create-template");
  };

  return (
    <div className="container mx-auto py-8">
      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="templates">
            <h1 className=" text-base sm:text-xl font-bold">{t("common.thome.My Templates")}</h1>
          </TabsTrigger>

          <TabsTrigger value="submissions">
            <h1 className="text-base sm:text-xl font-bold">{t("common.thome.My Submissions")}</h1>
          </TabsTrigger>
          <TabsTrigger value="salesforce">
            <h1 className="text-base sm:text-xl font-bold">Sync to Salesforce</h1>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="h-4 w-4 mr-2" />
                {t("common.thome.Filters")}
              </Button>
              <Button onClick={createNewTemplate}>
                <Plus className="mr-2 h-4 w-4" /> {t("common.thome.Create Template")}
              </Button>
            </div>
          </div>

          {showFilters && <TemplateFilters filters={filters} onFilterChange={handleFilterChange} topics={topics} />}

          <TemplateList error={error} templates={templates} isLoading={isLoading} isError={isError} userId={userId ?? null} filters={filters} totalPages={totalPages} onPageChange={handlePageChange} onLike={handleLike} onUnlike={handleUnLike} onView={handleViewTemplate} onEdit={handleEditTemplate} onDelete={handleDeleteTemplate} isDeleting={isDeleting} emptyStateMessage={t("common.thome.No templates found")} createButtonText={t("common.thome.Create your first template")} />
        </TabsContent>
        <TabsContent value="submissions" className="space-y-4">
          <UserAllResponses />
        </TabsContent>
        <TabsContent value="salesforce" className="space-y-4">
          <SalesforceSyncForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}

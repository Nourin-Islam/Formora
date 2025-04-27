import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "sonner";
import { Plus, Shell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TemplateCard from "@/components/templateShow/TemplateCard";
import FourTemplatesSkeleton from "../global/FourTemplatesSkeleton";

import { useLatestTemplates, useDeleteTemplate } from "@/hooks/useTemplates";
import { useLikeTemplate, useUnlikeTemplate } from "@/hooks/useTemplateInteractions";
import type { Template } from "@/types";

export default function LatestTemplatesSection() {
  const { t } = useTranslation("common");
  const { userId } = useAuth();
  const navigate = useNavigate();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);

  const filters = {
    page: 1,
    limit: 6,
    sortBy: "createdAt",
    sortOrder: "desc",
  };

  const { data: templatesData, isLoading, isError, refetch } = useLatestTemplates();
  const { mutate: deleteTemplate, isPending: isDeleting } = useDeleteTemplate();
  const likeMutation = useLikeTemplate([["templates", filters], ["popular-templates"], ["latest-templates"]]);
  const unlikeMutation = useUnlikeTemplate([["templates", filters], ["popular-templates"], ["latest-templates"]]);

  const addLike = (id: number) => likeMutation.mutate(id);
  const removeLike = (id: number) => unlikeMutation.mutate(id);

  const handleLike = (templateId: number) => {
    if (!userId) {
      toast.info(t("common.home.latest.please_sign_in_like"));
      return;
    }
    addLike(templateId);
  };

  const handleUnlike = (templateId: number) => {
    if (!userId) {
      toast.info(t("common.home.latest.please_sign_in_unlike"));
      return;
    }
    removeLike(templateId);
  };

  const handleViewTemplate = (id: number) => navigate(`/check-form/${id}`);
  const handleEditTemplate = (id: number) => navigate(`/manage-template/${id}`);
  const handleCreateTemplate = () => navigate("/create-template");

  const handleDeleteClick = (template: Template) => {
    setTemplateToDelete(template);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!templateToDelete) return;

    deleteTemplate(templateToDelete.id, {
      onSuccess: () => {
        toast.success(t("common.home.latest.template_deleted_success"));
        setIsDeleteDialogOpen(false);
        setTemplateToDelete(null);
        refetch();
      },
      onError: (error) => {
        console.error("Error deleting template:", error);
        toast.error(t("common.home.latest.template_delete_failed"));
      },
    });
  };

  if (isLoading) return <FourTemplatesSkeleton />;

  if (isError) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p className="text-red-500">{t("common.home.latest.load_templates_failed")}</p>
        <Button onClick={() => refetch()} className="mt-4">
          {t("common.home.latest.retry")}
        </Button>
      </div>
    );
  }

  return (
    <section className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">{t("common.home.latest.latest_creations")}</h1>

      {templatesData?.templates?.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-500">{t("no_templates_found")}</p>
          <Button variant="secondary" onClick={handleCreateTemplate} className="mt-4">
            <Plus className="mr-2 h-4 w-4" /> {t("create_template")}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templatesData?.templates?.map((template) => (
            <TemplateCard key={template.id} template={template} userId={userId ?? null} onDelete={handleDeleteClick} onLike={handleLike} onUnlike={handleUnlike} onView={handleViewTemplate} onEdit={handleEditTemplate} />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("confirm_deletion")}</DialogTitle>
            <DialogDescription>
              {t("confirm_deletion_text")} "{templateToDelete?.title}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting && <Shell className="h-4 w-4 mr-2 animate-spin" />}
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

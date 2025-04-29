import { useState, useEffect } from "react";
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
import ErrorReload from "@/components/global/ErrorReload";

export default function LatestTemplatesSection() {
  const { t } = useTranslation("common");
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);

  const filters = {
    page: 1,
    limit: 6,
    sortBy: "createdAt",
    sortOrder: "desc",
  };

  const { data: templatesData, isLoading, isError, error, refetch } = useLatestTemplates();
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

  // Cleanup function for pointer-events
  useEffect(() => {
    // When dialog is closed, ensure body is interactive
    if (!isDialogOpen) {
      const cleanup = () => {
        document.body.style.removeProperty("pointer-events");
        // Additional cleanup for any other styles that might be interfering
        document.body.style.removeProperty("overflow");
        document.body.style.removeProperty("padding-right");

        // Remove any other dialog-related classes that might be added
        const dialogBackdrops = document.querySelectorAll("[data-dialog-backdrop]");
        dialogBackdrops.forEach((el) => el.remove());
      };

      // Run cleanup after a short delay to ensure dialog closing animations complete
      setTimeout(cleanup, 100);
    }
    return () => {
      // Cleanup when component unmounts
      document.body.style.removeProperty("pointer-events");
    };
  }, [isDialogOpen]);

  // Handle dialog close
  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);

    setIsDeleteDialogOpen(open);
  };

  if (isLoading) return <FourTemplatesSkeleton />;

  if (isError) return <ErrorReload error={error} />;

  return (
    <section className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">{t("common.home.latest.latest_creations")}</h1>

      {templatesData?.templates?.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-500">{t("common.home.latest.no_templates_found")}</p>
          <Button variant="secondary" onClick={handleCreateTemplate} className="mt-4">
            <Plus className="mr-2 h-4 w-4" /> {t("common.home.latest.create_template")}
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
      <Dialog open={isDeleteDialogOpen} onOpenChange={() => handleDialogOpenChange(true)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common.home.latest.confirm_deletion")}</DialogTitle>
            <DialogDescription>
              {t("common.home.latest.confirm_deletion_text")} "{templateToDelete?.title}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleDialogOpenChange(false)}>
              {t("common.home.latest.cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting && <Shell className="h-4 w-4 mr-2 animate-spin" />}
              {t("common.home.latest.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

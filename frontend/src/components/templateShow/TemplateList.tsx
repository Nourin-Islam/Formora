// components/templates/TemplateList.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { Icons } from "@/components/global/icons";
import TemplatesSkeleton from "@/components/global/TemplatesSkeleton";
import TemplateCard from "./TemplateCard";
import { TemplateFilterOptions, Template } from "@/types";

interface TemplateListProps {
  templates: Template[];
  isLoading: boolean;
  isError: boolean;
  userId: string | null;
  filters: TemplateFilterOptions;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRefetch: () => void;
  onLike: (templateId: number) => void;
  onUnlike: (templateId: number) => void;
  onView?: (templateId: number) => void;
  onEdit?: (templateId: number) => void;
  onDelete?: (templateId: number, options?: { onSuccess?: () => void }) => void;
  isDeleting?: boolean;
  emptyStateMessage?: string;
  createButtonText?: string;
}

export default function TemplateList({ templates = [], isLoading = false, isError = false, userId, filters, totalPages = 1, onPageChange, onRefetch, onLike, onUnlike, onView, onEdit, onDelete, isDeleting = false, emptyStateMessage = "No templates found", createButtonText = "Create Template" }: TemplateListProps) {
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);

  const handleDeleteTemplateClick = (template: Template) => {
    setTemplateToDelete(template);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteTemplate = () => {
    if (!templateToDelete || !onDelete) return;

    onDelete(templateToDelete.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        setTemplateToDelete(null);
      },
    });
  };

  const createNewTemplate = () => {
    navigate("/create-template");
  };

  if (isLoading && templates.length === 0) {
    return <TemplatesSkeleton />;
  }

  if (isError) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p className="text-red-500">Failed to load templates. Please try again.</p>
        <Button onClick={onRefetch} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      {templates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-500">{emptyStateMessage}</p>
          <Button onClick={createNewTemplate} className="mt-4">
            <Plus className="mr-2 h-4 w-4" /> {createButtonText}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <TemplateCard key={template.id} template={template} userId={userId} onDelete={onDelete ? handleDeleteTemplateClick : undefined} onLike={onLike} onUnlike={onUnlike} onView={onView} onEdit={onEdit} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination>
            <Button variant="outline" onClick={() => onPageChange(filters.page - 1)} disabled={filters.page === 1}>
              Previous
            </Button>
            <div className="flex items-center mx-4">
              Page {filters.page} of {totalPages}
            </div>
            <Button variant="outline" onClick={() => onPageChange(filters.page + 1)} disabled={filters.page === totalPages}>
              Next
            </Button>
          </Pagination>
        </div>
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>Are you sure you want to delete the template "{templateToDelete?.title}"?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteTemplate} disabled={isDeleting}>
              {isDeleting && <Icons.spinner className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

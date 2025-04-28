// components/templates/TemplateCard.tsx
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Heart, MessageSquare, Edit, Eye, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { Template } from "@/types";
import { useTranslation } from "react-i18next";
import MDEditor from "@uiw/react-md-editor";
import { useThemeStore } from "@/store/themeStore";
import { motion } from "framer-motion";
import { cardVariants } from "@/lib/framerHelper";

interface TemplateCardProps {
  template: Template;
  userId: string | null;
  onDelete?: (template: Template) => void;
  onLike: (templateId: number) => void;
  onUnlike: (templateId: number) => void;
  onView?: (templateId: number) => void;
  onEdit?: (templateId: number) => void;
}

export default function TemplateCard({ template, userId, onDelete, onLike, onUnlike, onView, onEdit }: TemplateCardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation("common");
  const { theme } = useThemeStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  const handleFillTemplate = () => {
    if (onView) {
      onView(template.id);
    } else {
      navigate(`/check-form/${template.id}`);
    }
  };

  const handleViewTemplate = () => {
    // console.log("onView not provided, navigating to default route");
    navigate(`/view-template/${template.id}`);
  };

  const handleEditTemplate = () => {
    if (onEdit) {
      onEdit(template.id);
    } else {
      navigate(`/manage-template/${template.id}`);
    }
  };

  const handleLikeToggle = () => {
    if (!userId) {
      toast.info("Please sign in to like templates");
      return;
    }

    if (template.peopleLiked.includes(userId)) {
      onUnlike(template.id);
    } else {
      onLike(template.id);
    }
  };

  const handleDelete = (template: Template) => {
    if (onDelete) {
      onDelete(template);
      setIsDialogOpen(false);
    } else {
      toast.error("Delete function not provided");
    }
  };

  return (
    <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariants}>
      <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl mb-1 line-clamp-2">{template.title}</CardTitle>
              <CardDescription className="text-sm">
                {t("common.tCard.by")} {template.user.name} • {format(new Date(template.createdAt), "MMM d, yyyy")}
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {userId && (
                  <DropdownMenuItem onClick={handleFillTemplate}>
                    <Edit className="mr-2 h-4 w-4" /> {t("common.tCard.Fill")}
                  </DropdownMenuItem>
                )}
                {!userId && (
                  <DropdownMenuItem onClick={handleViewTemplate}>
                    <Eye className="mr-2 h-4 w-4" /> {t("common.tCard.Check")}
                  </DropdownMenuItem>
                )}
                {userId === template.user.clerkId && (
                  <>
                    <DropdownMenuItem onClick={handleEditTemplate}>
                      <Eye className="mr-2 h-4 w-4" />
                      {t("common.tCard.Manage")}
                    </DropdownMenuItem>
                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            // onDelete(template);
                            handleDelete(template);
                            setIsDialogOpen(true);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t("common.tCard.Delete")}
                        </DropdownMenuItem>
                      </>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
              {template.topic.name}
            </Badge>
            {template.isPublic ? (
              <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
                {t("common.tCard.Public")}
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                {t("common.tCard.Private")}
              </Badge>
            )}
            {template.isPublished ? (
              <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200">
                {t("common.tCard.Published")}
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-200">
                {t("common.tCard.Draft")}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          {template.description && (
            <div data-color-mode={theme} className="prose max-w-none line-clamp-3 mb-10">
              <MDEditor.Markdown source={template.description} />
            </div>
          )}
          {/* <p className="text-gray-600 line-clamp-3">
          <MDEditor.Markdown data-color-mode={theme === "dark" ? "dark" : "light"} source={template.description} />
        </p> */}
          <div className="mt-4 flex flex-wrap gap-1">
            {template.tags.slice(0, 3).map((tag) => (
              <Badge key={tag.id} variant="outline" className="mr-1">
                {tag.name}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Badge variant="outline">
                +{template.tags.length - 3} {t("common.tCard.more")}
              </Badge>
            )}
          </div>
          <div className="mt-3">
            <Badge variant="outline">
              <Check className="mr-1 h-3 w-3" /> {template.questionCount} {t("common.tCard.questions")}
            </Badge>
          </div>
        </CardContent>
        <CardFooter className="pt-2 flex justify-between border-t">
          <Button variant="ghost" size="sm" onClick={handleLikeToggle} className={userId && template.peopleLiked.includes(userId) ? "text-red-500" : ""}>
            <Heart className={`mr-1 h-4 w-4 ${userId && template.peopleLiked.includes(userId) ? "fill-current" : ""}`} />
            {template.likesCount}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleViewTemplate}>
            <MessageSquare className="mr-1 h-4 w-4" />
            {template.commentCount}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

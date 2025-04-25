import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Template } from "@/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageSquare, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import MDEditor from "@uiw/react-md-editor";
import { useThemeStore } from "@/store/themeStore";

interface TemplateCardSimpleProps {
  template: Template;
  index?: number;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: "easeOut",
    },
  }),
};

export default function TemplateCardSimple({ template, index = 0 }: TemplateCardSimpleProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme } = useThemeStore();

  const handleClick = () => {
    navigate(`/check-form/${template.id}`);
  };

  return (
    <motion.div custom={index} initial="hidden" animate="visible" variants={cardVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleClick} className="cursor-pointer">
      <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl mb-1 line-clamp-2">{template.title}</CardTitle>
              <CardDescription className="text-sm">
                {t("by")} {template.user.name} • {format(new Date(template.createdAt), "MMM d, yyyy")}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
              {template.topic.name}
            </Badge>
            {template.isPublic ? (
              <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
                {t("Public")}
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                {t("Private")}
              </Badge>
            )}
            {template.isPublished ? (
              <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200">
                {t("Published")}
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-200">
                {t("Draft")}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          {template.description && (
            <div data-color-mode={theme}>
              <MDEditor.Markdown source={template.description} className="prose max-w-none line-clamp-3" />
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-1">
            {template.tags.slice(0, 3).map((tag) => (
              <Badge key={tag.id} variant="outline" className="mr-1">
                {tag.name}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Badge variant="outline">
                +{template.tags.length - 3} {t("more")}
              </Badge>
            )}
          </div>
          <div className="mt-3">
            <Badge variant="outline">
              <Check className="mr-1 h-3 w-3" /> {template.questionCount} {t("questions")}
            </Badge>
          </div>
        </CardContent>
        <CardFooter className="pt-2 flex justify-between border-t">
          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <Heart className="h-4 w-4" />
            {template.likesCount}
          </div>
          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <MessageSquare className="h-4 w-4" />
            {template.commentCount}
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TagInput } from "@/components/templateCreateEdit/TagInput";
import { UserSelector } from "@/components/templateCreateEdit/UserSelector";
import ImageUpload from "@/components/templateCreateEdit/ImageUpload";
import { TopicSelector } from "@/components/templateCreateEdit/TopicSelector";
import { QuestionManagement } from "@/components/templateCreateEdit/QuestionManagement";
import { useCreateTemplate } from "@/hooks/useTemplates";
import { Question, User } from "@/types";
import { Shell } from "lucide-react";
import { useTranslation } from "react-i18next";
import MDEditor from "@uiw/react-md-editor";
import { useThemeStore } from "@/store/themeStore";

export default function TemplateCreationForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topicId, setTopicId] = useState(1);
  const [isPublic, setIsPublic] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [activeTab, setActiveTab] = useState("general");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { theme } = useThemeStore();

  const createTemplate = useCreateTemplate();

  const onSubmit = async (publish: boolean) => {
    if (!title.trim()) {
      toast.error(t("Title is required"));
      setActiveTab("general");
      return;
    }
    // if title is too long, show error
    if (title.length > 200) {
      toast.error(t("Title is too long"));
      setActiveTab("general");
      return;
    }

    if (!description.trim()) {
      toast.error(t("Description is required"));
      setActiveTab("general");
      return;
    }
    // if description is too long, show error
    if (description.length > 500) {
      toast.error(t("Description is too long"));
      setActiveTab("general");
      return;
    }

    if (!topicId) {
      toast.error(t("Topic is required"));
      setActiveTab("general");
      return;
    }

    if (questions.length === 0) {
      toast.error(t("Please add at least one question"));
      setActiveTab("questions");
      return;
    }
    setIsSubmitting(true);

    try {
      const templateData = {
        title,
        description,
        topicId,
        isPublic,
        isPublished: publish,
        imageUrl: imageUrl || null,
        tags: selectedTags,
        accessUsers: !isPublic ? selectedUsers.map((user) => user.id) : [],
        questions: questions.map((q, index) => ({
          ...q,
          position: index,
        })),
      };

      await createTemplate.mutateAsync(templateData);
      toast.success(`${t("Template")} ${publish ? t("published") : t("saved")} ${t("successfully")}`);
      navigate(`/templates`);
    } catch (error) {
      toast.error(t("Failed to create template"));
      console.error("Template creation error:", error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("Create New Template")}</CardTitle>
          <CardDescription>{t("Design your form template with custom questions")}</CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="general">{t("General Settings")}</TabsTrigger>
              <TabsTrigger value="questions">
                {t("Questions")} ({questions.length})
              </TabsTrigger>
              <TabsTrigger value="access">{t("Access Settings")}</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t("Title *")}</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("Enter template title")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t("Description *")}</Label>

                <MDEditor data-color-mode={theme === "dark" ? "dark" : "light"} value={description} onChange={(val) => setDescription(val || "")} preview="edit" height={200} />
              </div>

              <div className="space-y-2">
                <TopicSelector value={topicId.toString()} onChange={(id) => setTopicId(id)} />
              </div>

              <div className="space-y-2">
                <Label>{t("Tags")}</Label>
                <TagInput value={selectedTags} onChange={setSelectedTags} />
              </div>

              <div className="space-y-2">
                <Label>{t("Image (Optional)")}</Label>
                <ImageUpload imageUrl={imageUrl} setImageUrl={setImageUrl} />
              </div>
            </TabsContent>

            <TabsContent value="questions">
              <QuestionManagement questions={questions} setQuestions={setQuestions} />
            </TabsContent>

            <TabsContent value="access" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch id="isPublic" checked={isPublic} onCheckedChange={setIsPublic} />
                <Label htmlFor="isPublic">{t("Public template (accessible to all authenticated users)")}</Label>
              </div>

              {!isPublic && (
                <div className="space-y-2">
                  <Label>{t("Select users who can access this template")}</Label>
                  <UserSelector selectedUsers={selectedUsers} onChange={setSelectedUsers} />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate(-1)}>
            {t("Cancel")}
          </Button>
          <div className="flex gap-2">
            <Button variant={"outline"} className="cursor-pointer" disabled={isSubmitting} onClick={() => onSubmit(false)}>
              {isSubmitting && <Shell className="h-4 w-4 mr-2 animate-spin" />}
              {t("Save as Draft")}
            </Button>
            <Button variant={"outline"} className="cursor-pointer" disabled={isSubmitting} onClick={() => onSubmit(true)}>
              {isSubmitting && <Shell className="h-4 w-4 mr-2 animate-spin" />} {t("Publish Template")}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

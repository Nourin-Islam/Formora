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
import useSEO from "@/hooks/useSEO";

export default function TemplateCreationForm() {
  useSEO({
    title: "Formora: Create Template",
    description: "Create your own template with Formora.",
    keywords: "privacy, data protection, Formora",
  });
  const { t } = useTranslation("common");
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
      toast.error(t("common.tCreate.Title is required"));
      setActiveTab("general");
      return;
    }
    // if title is too long, show error
    if (title.length > 200) {
      toast.error(t("common.tCreate.Title is too long"));
      setActiveTab("general");
      return;
    }

    if (!description.trim()) {
      toast.error(t("common.tCreate.Description is required"));
      setActiveTab("general");
      return;
    }
    // if description is too long, show error
    if (description.length > 500) {
      toast.error(t("common.tCreate.Description is too long"));
      setActiveTab("general");
      return;
    }

    if (!topicId) {
      toast.error(t("common.tCreate.Topic is required"));
      setActiveTab("general");
      return;
    }

    if (questions.length === 0) {
      toast.error(t("common.tCreate.Please add at least one question"));
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
      toast.success(`${t("common.tCreate.Template")} ${publish ? t("common.tCreate.published") : t("common.tCreate.saved")} ${t("common.tCreate.successfully")}`);
      navigate(`/templates`);
    } catch (error) {
      toast.error(t("common.tCreate.Failed to create template"));
      console.error("Template creation error:", error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("common.tCreate.Create New Template")}</CardTitle>
          <CardDescription>{t("common.tCreate.Design your form template with custom questions")}</CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-8 sm:mb-4 items-center flex flex-wrap space-y-2 ">
              <TabsTrigger value="general">{t("common.tCreate.General Settings")}</TabsTrigger>
              <TabsTrigger className="flex justify-center items-center my-0" value="questions">
                {t("common.tCreate.Questions")} ({questions.length})
              </TabsTrigger>
              <TabsTrigger value="access">{t("common.tCreate.Access Settings")}</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t("common.tCreate.Title *")}</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("common.tCreate.Enter template title")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t("common.tCreate.Description *")}</Label>

                <MDEditor data-color-mode={theme === "dark" ? "dark" : "light"} value={description} onChange={(val) => setDescription(val || "")} preview="edit" height={200} />
              </div>

              <div className="space-y-2">
                <TopicSelector value={topicId.toString()} onChange={(id) => setTopicId(id)} />
              </div>

              <div className="space-y-2">
                <Label>{t("common.tCreate.Tags")}</Label>
                <TagInput value={selectedTags} onChange={setSelectedTags} />
              </div>

              <div className="space-y-2">
                <Label>{t("common.tCreate.Image (Optional)")}</Label>
                <ImageUpload imageUrl={imageUrl} setImageUrl={setImageUrl} />
              </div>
            </TabsContent>

            <TabsContent value="questions">
              <QuestionManagement questions={questions} setQuestions={setQuestions} />
            </TabsContent>

            <TabsContent value="access" className="space-y-4 mt-6">
              <div className="flex items-center space-x-2">
                <Switch id="isPublic" checked={isPublic} onCheckedChange={setIsPublic} />
                <Label htmlFor="isPublic">{t("common.tCreate.Public template (accessible to all authenticated users)")}</Label>
              </div>

              {!isPublic && (
                <div className="space-y-2">
                  <Label>{t("common.tCreate.Select users who can access this template")}</Label>
                  <UserSelector selectedUsers={selectedUsers} onChange={setSelectedUsers} />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex justify-center space-y-4 sm:justify-between flex-wrap">
          <Button variant="outline" onClick={() => navigate(-1)}>
            {t("common.tCreate.Cancel")}
          </Button>
          <div className="flex gap-2">
            <Button variant={"outline"} className="cursor-pointer" disabled={isSubmitting} onClick={() => onSubmit(false)}>
              {isSubmitting && <Shell className="h-4 w-4 mr-2 animate-spin" />}
              {t("common.tCreate.Save as Draft")}
            </Button>
            <Button variant={"outline"} className="cursor-pointer" disabled={isSubmitting} onClick={() => onSubmit(true)}>
              {isSubmitting && <Shell className="h-4 w-4 mr-2 animate-spin" />} {t("common.tCreate.Publish Template")}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

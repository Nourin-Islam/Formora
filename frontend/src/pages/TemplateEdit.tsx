import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import MDEditor from "@uiw/react-md-editor";
import { Question, User } from "@/types";
import { useUpdateTemplate, useTemplateById } from "@/hooks/useTemplates";
import TemplatesSkeleton from "@/components/global/TemplatesSkeleton";
import { Comments } from "@/components/formRelated/Comments";
import { useTranslation } from "react-i18next";
import { useThemeStore } from "@/store/themeStore";
import TemplatesPreviousSubmissions from "@/components/templateShow/TemplatesPreviousSubmissions";
import useSEO from "@/hooks/useSEO";
import ErrorReload from "@/components/global/ErrorReload";

export default function TemplateEdit() {
  useSEO({
    title: "Formora: Edit Template",
    description: "Edit your template with Formora.",
    keywords: "privacy, data protection, Formora",
  });
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation("common");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topicId, setTopicId] = useState<number | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeTab, setActiveTab] = useState("general");

  const { data: template, isLoading, error } = useTemplateById(id!);
  const updateTemplate = useUpdateTemplate();
  const { theme } = useThemeStore();

  useEffect(() => {
    if (template) {
      setTitle(template.title);
      setDescription(template.description);
      setTopicId(template.topicId);
      setIsPublic(template.isPublic);
      setSelectedTags(template.tags.map((tag) => tag.name));
      setSelectedUsers(template.accessUsers || []);
      setImageUrl(template.imageUrl || "");
      setQuestions(template.questions || []);
    }
  }, [template]);

  const isFormDirty = useMemo(() => {
    if (!template) return false;

    if (title !== template.title || description !== template.description || topicId !== template.topicId || isPublic !== template.isPublic || imageUrl !== (template.imageUrl || "") || JSON.stringify(selectedTags) !== JSON.stringify(template.tags.map((t) => t.name)) || JSON.stringify(questions) !== JSON.stringify(template.questions) || (!isPublic && JSON.stringify(selectedUsers) !== JSON.stringify(template.accessUsers || []))) {
      return true;
    }

    return false;
  }, [title, description, topicId, isPublic, imageUrl, selectedTags, questions, selectedUsers, template]);
  // console.log("Received template:", template);
  const handleSubmit = async (publish: boolean) => {
    if (!title.trim()) {
      toast.error(t("common.tedit.Title is required"));
      setActiveTab("general");
      return;
    }

    // if title is too long, show error
    if (title.length > 200) {
      toast.error(t("common.tedit.Title is too long"));
      setActiveTab("general");
      return;
    }

    if (!description.trim()) {
      toast.error(t("common.tedit.Description is required"));
      setActiveTab("general");
      return;
    }

    // if description is too long, show error
    if (description.length > 500) {
      toast.error(t("common.tedit.Description is too long"));
      setActiveTab("general");
      return;
    }

    if (!topicId) {
      toast.error(t("common.tedit.Topic is required"));
      setActiveTab("general");
      return;
    }

    if (questions.length === 0) {
      toast.error(t("common.tedit.Please add at least one question"));
      setActiveTab("questions");
      return;
    }

    try {
      const templateData = {
        id: id!,
        title,
        description,
        topicId,
        isPublic,
        isPublished: publish,
        imageUrl: imageUrl || null,
        tags: selectedTags,
        accessUsers: !isPublic ? selectedUsers.map((u) => u.id) : [],
        questions: questions.map((q, index) => ({
          // only send id field if q.id is a number
          id: typeof q.id === "number" ? q.id : undefined,
          title: q.title,
          description: q.description,
          questionType: q.questionType,
          position: index,
          showInTable: q.showInTable,
          options: q.options || null,
          correctAnswers: q.correctAnswers || null,
        })),
      };

      await updateTemplate.mutateAsync({ id: id!, templateData });
      toast.success(`${t("common.tedit.Template")} ${publish ? t("common.tedit.published") : t("common.tedit.updated")} ${t("common.tedit.successfully")}`);
      navigate("/templates");
    } catch (error) {
      toast.error(t("common.tedit.Failed to update template"));
      console.error("Template update error:", error);
    }
  };

  if (isLoading) return <TemplatesSkeleton />;
  if (error) return <ErrorReload error={error} />;

  if (!template) return <div>{t("common.tedit.Template not found")}</div>;

  return (
    <>
      <form className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("common.tedit.Manage Template")}</CardTitle>
            <CardDescription>{t("common.tedit.Edit Details || Add Question || Change Access || Check Submissions")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-8 sm:mb-4 items-center flex flex-wrap space-y-2 ">
                <TabsTrigger value="general">{t("common.tedit.General Settings")}</TabsTrigger>
                <TabsTrigger className="flex justify-center items-center my-0" value="questions">
                  {t("common.tedit.Questions")} ({questions.length})
                </TabsTrigger>
                <TabsTrigger value="access">{t("common.tedit.Access")}</TabsTrigger>
                <TabsTrigger value="previousSubmissions">{t("common.tedit.Submissions")}</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">{t("common.tedit.Title*")}</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t("common.tedit.Description *")}</Label>
                  <MDEditor data-color-mode={theme === "dark" ? "dark" : "light"} value={description} onChange={(value) => setDescription(value || "")} preview="edit" height={300} />
                </div>

                <div className="space-y-2">
                  <TopicSelector value={topicId?.toString() || null} onChange={(val) => setTopicId(Number(val))} />
                </div>

                <div className="space-y-2">
                  <Label>{t("common.tedit.Tags")}</Label>
                  <TagInput value={selectedTags} onChange={setSelectedTags} />
                </div>

                <div className="space-y-2">
                  <Label>{t("common.tedit.Image (Optional)")}</Label>
                  <ImageUpload imageUrl={imageUrl} setImageUrl={setImageUrl} />
                </div>
              </TabsContent>

              <TabsContent value="questions">
                <QuestionManagement questions={questions} setQuestions={setQuestions} />
              </TabsContent>

              <TabsContent value="access" className="space-y-4 mt-6">
                <div className="flex items-center space-x-2">
                  <Switch id="isPublic" checked={isPublic} onCheckedChange={setIsPublic} />
                  <Label htmlFor="isPublic">{t("common.tedit.Public template (accessible to all authenticated users)")}</Label>
                </div>
                {!isPublic && (
                  <div className="space-y-2">
                    <Label>{t("common.tedit.Select users who can access this template")}</Label>
                    <UserSelector selectedUsers={selectedUsers} onChange={setSelectedUsers} />
                  </div>
                )}
              </TabsContent>
              <TabsContent value="previousSubmissions">
                {/* <PreviousSubmissions id={id!} /> */}
                <TemplatesPreviousSubmissions id={id!} />
              </TabsContent>
            </Tabs>
          </CardContent>

          {activeTab !== "previousSubmissions" && (
            <CardFooter className="flex flex-wrap justify-between">
              <Button variant="outline" type="button" onClick={() => navigate(-1)} disabled={updateTemplate.isPending}>
                {t("common.tedit.Cancel")}
              </Button>

              <Button className="ml-auto mr-3" variant="secondary" type="button" onClick={() => handleSubmit(false)} disabled={updateTemplate.isPending || !isFormDirty}>
                {updateTemplate.isPending ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-white"></span>
                    {t("common.tedit.Saving...")}
                  </>
                ) : (
                  t("common.tedit.Update Draft")
                )}
              </Button>

              <Button variant="default" type="button" onClick={() => handleSubmit(true)} disabled={updateTemplate.isPending || !isFormDirty}>
                {updateTemplate.isPending ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-white"></span>
                    {t("common.tedit.Publishing...")}
                  </>
                ) : (
                  t("common.tedit.Publish Template")
                )}
              </Button>
            </CardFooter>
          )}
        </Card>
      </form>
      {id && <Comments templateId={parseInt(id, 10)} />}
    </>
  );
}

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTemplateStore } from "@/store/templateStore";
import { TagInput } from "@/components/TagInput";
import { UserSelector } from "@/components/UserSelector";
import ImageUpload from "@/components/ImageUpload";
import { TopicSelector } from "@/components/TopicSelector";
import { QuestionManagement } from "@/components/QuestionManagement";
import { z } from "zod";

import MDEditor from "@uiw/react-md-editor";
import { Question } from "../types";
import { useAuth } from "@clerk/clerk-react";

const templateFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().min(1, "Description is required").max(500),
  topicId: z.coerce.number().min(1, "Topic is required"),
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;

interface User {
  id: number;
  name: string;
  email: string;
}

export default function TemplateCreationForm() {
  const navigate = useNavigate();
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]); // Properly typed now
  const [activeTab, setActiveTab] = useState<string>("general");
  const MemoizedTopicSelector = useMemo(() => TopicSelector, []);

  const createTemplate = useTemplateStore((state) => state.createTemplate);
  const { getToken } = useAuth();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      title: "",
      description: "",
      topicId: 1,
    },
  });

  const onSubmit = async (data: TemplateFormValues, publish: boolean) => {
    try {
      if (questions.length === 0) {
        toast.error("Please add at least one question to your template");
        setActiveTab("questions");
        return;
      }

      const templateData = {
        title: data.title,
        description: data.description,
        topicId: data.topicId,
        isPublic,
        isPublished: publish,
        imageUrl: imageUrl || null,
        tags: selectedTags,
        accessUsers: !isPublic ? selectedUsers.map((user) => user.id) : [],
        questions: questions.map((q, index) => ({
          id: q.id,
          title: q.title,
          description: q.description,
          questionType: q.questionType,
          position: index, // Ensure sequential ordering
          showInTable: q.showInTable,
          options: q.options || null,
          correctAnswers: q.correctAnswers || null,
        })),
      };

      console.log("Template Data:", templateData);
      const createdTemplate = await createTemplate(templateData, getToken);

      toast.success(`Template ${publish ? "published" : "saved"} successfully`);
      navigate(`/templates/${createdTemplate.id}`);
    } catch (error) {
      toast.error("Failed to create template");
      console.error("Template creation error:", error);
    }
  };

  // Function to handle tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data, true))} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Template</CardTitle>
          <CardDescription>Design your form template with custom questions</CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="general" value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-4">
              <TabsTrigger value="general">General Settings</TabsTrigger>
              <TabsTrigger value="questions">Questions ({questions.length})</TabsTrigger>
              <TabsTrigger value="access">Access Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" placeholder="Enter template title" {...register("title")} />
                {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <div className="rounded border" data-color-mode="light">
                      <MDEditor value={field.value} onChange={field.onChange} preview="edit" height={300} />
                    </div>
                  )}
                />
                {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
              </div>

              <div className="space-y-2">
                <Controller name="topicId" control={control} render={({ field }) => <MemoizedTopicSelector value={field.value?.toString() || null} onChange={field.onChange} />} />
                {errors.topicId && <p className="text-sm text-red-500">{errors.topicId.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <TagInput value={selectedTags} onChange={setSelectedTags} />
              </div>

              <div className="space-y-2">
                <Label>Image (Optional)</Label>
                <ImageUpload imageUrl={imageUrl} setImageUrl={setImageUrl} />
              </div>
            </TabsContent>

            <TabsContent value="questions">
              <QuestionManagement questions={questions} onQuestionsUpdate={setQuestions} />
            </TabsContent>

            <TabsContent value="access" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch id="isPublic" checked={isPublic} onCheckedChange={setIsPublic} />
                <Label htmlFor="isPublic">Public template (accessible to all authenticated users)</Label>
              </div>

              {!isPublic && (
                <div className="space-y-2">
                  <Label>Select users who can access this template</Label>

                  <UserSelector
                    selectedUsers={selectedUsers}
                    onChange={setSelectedUsers}
                    // excludeUsers={[currentUserId]} // Optional: exclude current user
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button" onClick={() => navigate(-1)} disabled={isSubmitting}>
            Cancel
          </Button>

          <Button className="ml-auto" type="button" variant="secondary" onClick={() => handleSubmit((data) => onSubmit(data, false))()} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-white"></span>
                Saving...
              </>
            ) : (
              "Draft Template"
            )}
          </Button>

          <Button className="ml-3" type="button" variant="default" onClick={() => handleSubmit((data) => onSubmit(data, true))()} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-white"></span>
                Publishing...
              </>
            ) : (
              "Publish Template"
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

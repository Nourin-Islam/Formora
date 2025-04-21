import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TagInput } from "@/components/TagInput";
import { UserSelector } from "@/components/UserSelector";
import ImageUpload from "@/components/ImageUpload";
import { TopicSelector } from "@/components/TopicSelector";
import { QuestionManagement } from "@/components/QuestionManagement";
import { useCreateTemplate } from "@/hooks/useTemplates";
import { Question, User } from "@/types";
import { Icons } from "@/components/global/icons";

export default function TemplateCreationForm() {
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createTemplate = useCreateTemplate();

  const onSubmit = async (publish: boolean) => {
    if (!title.trim()) {
      toast.error("Title is required");
      setActiveTab("general");
      return;
    }

    if (!description.trim()) {
      toast.error("Description is required");
      setActiveTab("general");
      return;
    }

    if (!topicId) {
      toast.error("Topic is required");
      setActiveTab("general");
      return;
    }

    if (questions.length === 0) {
      toast.error("Please add at least one question");
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
      toast.success(`Template ${publish ? "published" : "saved"} successfully`);
      navigate(`/templates`);
    } catch (error) {
      toast.error("Failed to create template");
      console.error("Template creation error:", error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Template</CardTitle>
          <CardDescription>Design your form template with custom questions</CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="general">General Settings</TabsTrigger>
              <TabsTrigger value="questions">Questions ({questions.length})</TabsTrigger>
              <TabsTrigger value="access">Access Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter template title" />
                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter template description" className="w-full min-h-[200px] p-2 border rounded" />
                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
              </div>

              <div className="space-y-2">
                <TopicSelector value={topicId.toString()} onChange={(id) => setTopicId(id)} />
                {errors.topicId && <p className="text-sm text-red-500">{errors.topicId}</p>}
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
              <QuestionManagement questions={questions} setQuestions={setQuestions} />
              {errors.questions && <p className="text-sm text-red-500">{errors.questions}</p>}
            </TabsContent>

            <TabsContent value="access" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch id="isPublic" checked={isPublic} onCheckedChange={setIsPublic} />
                <Label htmlFor="isPublic">Public template (accessible to all authenticated users)</Label>
              </div>

              {!isPublic && (
                <div className="space-y-2">
                  <Label>Select users who can access this template</Label>
                  <UserSelector selectedUsers={selectedUsers} onChange={setSelectedUsers} />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button className="cursor-pointer" disabled={isSubmitting} variant="secondary" onClick={() => onSubmit(false)}>
              {isSubmitting && <Icons.spinner className="h-4 w-4 mr-2 animate-spin" />}Save as Draft
            </Button>
            <Button className="cursor-pointer" disabled={isSubmitting} onClick={() => onSubmit(true)}>
              {isSubmitting && <Icons.spinner className="h-4 w-4 mr-2 animate-spin" />} Publish Template
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

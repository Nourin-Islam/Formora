import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTemplateStore } from "@/store/templateStore";
import { TagInput } from "@/components/TagInput";
import { UserSelector } from "@/components/UserSelector";
import { ImageUpload } from "@/components/ImageUpload";
import { TopicSelector } from "@/components/TopicSelector";
import { z } from "zod";
import { useAuth } from "@clerk/clerk-react";

const templateFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().min(1, "Description is required").max(500),
  topicId: z.string().min(1, "Topic is required"),
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;

interface User {
  id: string;
  name: string;
  email: string;
}

export default function TemplateCreationForm() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [imageUrl, setImageUrl] = useState<string>("");
  const MemoizedTopicSelector = useMemo(() => TopicSelector, []);

  const createTemplate = useTemplateStore((state) => state.createTemplate);

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
      topicId: "",
    },
  });

  const onSubmit = async (data: TemplateFormValues) => {
    try {
      const templateData = {
        title: data.title,
        description: data.description,
        topicId: parseInt(data.topicId), // Convert to number
        isPublic,
        imageUrl: imageUrl || null,
        tags: selectedTags,
        accessUsers: !isPublic ? selectedUsers.map((user) => user.id) : [],
      };

      await createTemplate(templateData); // This should match your backend input type

      toast.success("Template created successfully");
      navigate("/templates");
    } catch (error) {
      toast.error("Failed to create template");
      console.error("Template creation error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Template</CardTitle>
          <CardDescription>Design your form template with custom questions</CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="general">
            <TabsList className="mb-4">
              <TabsTrigger value="general">General Settings</TabsTrigger>
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
                <Textarea id="description" rows={5} placeholder="Supports markdown formatting" {...register("description")} />
                {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="topicId">Topic *</Label>
                <Controller name="topicId" control={control} render={({ field }) => <MemoizedTopicSelector id="topicId" value={field.value} onChange={field.onChange} error={errors.topicId?.message} getToken={getToken} />} />
                {errors.topicId && <p className="text-sm text-red-500">{errors.topicId.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <TagInput value={selectedTags} onChange={setSelectedTags} placeholder="Add tags..." />
              </div>

              <div className="space-y-2">
                <Label>Image (Optional)</Label>
                <ImageUpload
                  value={imageUrl}
                  onChange={setImageUrl}
                  maxSize={5} // 5MB
                  accept="image/*"
                />
              </div>
            </TabsContent>

            <TabsContent value="access" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch id="isPublic" checked={isPublic} onCheckedChange={setIsPublic} />
                <Label htmlFor="isPublic">Public template (accessible to all authenticated users)</Label>
              </div>

              {!isPublic && (
                <div className="space-y-2">
                  <Label>Select users who can access this template</Label>
                  <UserSelector selectedUsers={selectedUsers} onChange={setSelectedUsers} placeholder="Search users..." />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button" onClick={() => navigate(-1)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Template"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

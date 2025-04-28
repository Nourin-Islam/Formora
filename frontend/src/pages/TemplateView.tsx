import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Heart } from "lucide-react";
import { publicApi } from "@/lib/api";
import { useAuth } from "@clerk/clerk-react";
import SmallSkeleton from "@/components/global/SmallSkeleton";
import { useEffect } from "react";
import { Comments } from "@/components/formRelated/Comments";
import { useTranslation } from "react-i18next";
import MDEditor from "@uiw/react-md-editor";
import { useThemeStore } from "@/store/themeStore";
import useSEO from "@/hooks/useSEO";

const TemplateView = () => {
  useSEO({
    title: "Formora: Template View",
    description: "View the details of the template.",
    keywords: "privacy, data protection, Formora",
  });
  const { id } = useParams();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { t } = useTranslation("common");

  // Redirect to the full template view if user is logged in
  useEffect(() => {
    if (userId) {
      navigate(`/view-template/${id}`);
    }
  }, [userId]);

  // Function to prompt login
  const promptLogin = () => {
    toast.info(t("common.fFill.Please sign in to fill this form"));
  };

  // Fetch template data
  const {
    data: templateData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["templates", id, "preview"],
    queryFn: async () => {
      try {
        const response = await publicApi.get(`/forms/check/${id}`);
        return response.data;
      } catch (err: any) {
        toast.error(err || t("common.fFill.Failed to load form"));
      }
    },
    retry: false,
  });

  // console.log("templateData", templateData);
  const template = templateData?.template;
  const { theme } = useThemeStore();

  // Generate dynamic schema based on template questions
  const formSchema: z.ZodObject<any> = z.object({
    ...(template?.questions?.reduce((acc: Record<string, any>, question: any) => {
      switch (question.questionType) {
        case "STRING":
          acc[`question_${question.id}`] = z.string().optional();
          break;
        case "TEXT":
          acc[`question_${question.id}`] = z.string().optional();
          break;
        case "INTEGER":
          acc[`question_${question.id}`] = z.number().optional();
          break;
        case "CHECKBOX":
          if (question.options && question.options.length > 0) {
            acc[`question_${question.id}`] = z.array(z.string()).optional();
          } else {
            acc[`question_${question.id}`] = z.boolean().optional();
          }
          break;
      }
      return acc;
    }, {}) || {}),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (template?.questions) {
      const defaultValues = template.questions.reduce((values: Record<string, any>, question: any) => {
        if (question.questionType === "CHECKBOX" && question.options?.length > 0) {
          values[`question_${question.id}`] = [];
        } else if (question.questionType === "CHECKBOX") {
          values[`question_${question.id}`] = false;
        } else {
          values[`question_${question.id}`] = "";
        }
        return values;
      }, {});

      form.reset(defaultValues);
    }
  }, [template, form]);

  if (isLoading) {
    return <SmallSkeleton />;
  }

  if (error) {
    return (
      <div className="container max-w-4xl py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{(error as any)?.response?.data?.error || t("common.fFill.Failed to load form")}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="container max-w-4xl py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t("common.fFill.Form template not found")}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <Card>
        <CardHeader>
          {template.imageUrl && <img src={`https://ik.imagekit.io/odinbook/${template.imageUrl}`} alt={template.title} className="w-full h-40 object-cover rounded-t-md mb-4" style={{ height: "150px" }} />}
          <CardTitle>{template.title}</CardTitle>
          {template.description && (
            <div data-color-mode={theme} className="prose max-w-none">
              <MDEditor.Markdown source={template.description} />
            </div>
          )}
        </CardHeader>

        <CardContent onClick={promptLogin}>
          <div className="space-y-6">
            {template.questions.map((question: any) => (
              <div key={question.id} className="space-y-2">
                <Label htmlFor={`question_${question.id}`}>{question.title}</Label>
                {question.description && <p className="text-sm text-muted-foreground">{question.description}</p>}

                <Controller
                  name={`question_${question.id}`}
                  control={form.control}
                  render={({ field }) => {
                    switch (question.questionType) {
                      case "STRING":
                        return <Input id={`question_${question.id}`} {...field} disabled />;
                      case "TEXT":
                        return <Textarea id={`question_${question.id}`} {...field} disabled />;
                      case "INTEGER":
                        return <Input id={`question_${question.id}`} type="number" value={field.value || ""} disabled />;
                      case "CHECKBOX":
                        if (question.options?.length > 0) {
                          // Multiple choice (checkbox group)
                          return (
                            <div className="space-y-2">
                              {question.options.map((option: string) => (
                                <div key={option} className="flex items-center space-x-2">
                                  <Checkbox id={`${question.id}_${option}`} checked={field.value?.includes(option)} disabled />
                                  <Label htmlFor={`${question.id}_${option}`}>{option}</Label>
                                </div>
                              ))}
                            </div>
                          );
                        } else {
                          // Single checkbox
                          return (
                            <div className="flex items-center space-x-2">
                              <Checkbox id={`question_${question.id}`} checked={field.value} disabled />
                              <Label htmlFor={`question_${question.id}`}>{t("common.fFill.Yes")}</Label>
                            </div>
                          );
                        }
                      default:
                        return <></>;
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </CardContent>

        <CardFooter className="flex justify-between border-t">
          <Button onClick={promptLogin} variant="ghost" size="sm" className="text-red-500">
            <Heart className={`mr-1 h-4 w-4 ${userId && template.peopleLiked.includes(userId) ? "fill-current" : ""}`} />
            {template.likesCount}
          </Button>
          <Button onClick={promptLogin}>{t("common.fFill.Sign in to submit")}</Button>
        </CardFooter>
      </Card>
      {id && <Comments templateId={parseInt(id, 10)} />}
    </div>
  );
};

export default TemplateView;

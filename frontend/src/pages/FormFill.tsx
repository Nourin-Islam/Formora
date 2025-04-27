import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { AlertCircle } from "lucide-react";
import { createAuthenticatedApi } from "@/lib/api";
import { useAuth } from "@clerk/clerk-react";
import SmallSkeleton from "@/components/global/SmallSkeleton";
import { useEffect } from "react";
import { Comments } from "@/components/formRelated/Comments";
import { useTranslation } from "react-i18next";
import MDEditor from "@uiw/react-md-editor";
import { useThemeStore } from "@/store/themeStore";

const FormFill = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getToken, userId } = useAuth();
  const { t } = useTranslation("common");

  // Fetch template data and check if user has already submitted
  const {
    data: templateData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["templates", id, "fill", userId],
    queryFn: async () => {
      try {
        const { authenticatedApi } = await createAuthenticatedApi(getToken);
        const response = await authenticatedApi.get(`/forms/fill/${id}`);
        return response.data;
      } catch (err: any) {
        // console.log("Error fetching template data:", err);
        toast.error(err || t("common.fFill.Failed to load form"));
        // if (err.response?.data?.error) {
        //   // Throw the error with the server message
        //   throw new Error(err.response.data.error.message);
        // }
        // throw err;
      }
    },
    retry: false,
  });

  const template = templateData?.template;
  const existingForm = templateData?.existingForm;
  const { theme } = useThemeStore();

  // Generate dynamic schema based on template questions
  const formSchema: z.ZodObject<any> = z.object({
    ...(template?.questions?.reduce((acc: Record<string, any>, question: any) => {
      switch (question.questionType) {
        case "STRING":
          acc[`question_${question.id}`] = z.string().min(1, "This field is required");
          break;
        case "TEXT":
          acc[`question_${question.id}`] = z.string().min(1, "This field is required");
          break;
        case "INTEGER":
          acc[`question_${question.id}`] = z.number().min(0, "Must be a positive number");
          break;
        case "CHECKBOX":
          if (question.options && question.options.length > 0) {
            // For multiple choice (checkbox group)
            acc[`question_${question.id}`] = z.array(z.string()).min(1, "Select at least one option");
          } else {
            // For single checkbox
            acc[`question_${question.id}`] = z.boolean();
          }
          break;
      }
      return acc;
    }, {}) || {}),
    sendEmailCopy: z.boolean().optional().default(false),
    userEmail: z
      .string()
      .refine(
        (val) => {
          // If sendEmailCopy is true, email must be valid
          const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          return !form.watch("sendEmailCopy") || emailRegex.test(val);
        },
        { message: `${t("common.fFill.Please enter a valid email address")}` }
      )
      .optional(),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (template?.questions) {
      const defaultValues = {
        // Existing default values setup
        ...template.questions.reduce((values: Record<string, any>, question: any) => {
          if (question.questionType === "CHECKBOX" && question.options?.length > 0) {
            values[`question_${question.id}`] = [];
          } else if (question.questionType === "CHECKBOX") {
            values[`question_${question.id}`] = false;
          } else {
            values[`question_${question.id}`] = "";
          }
          return values;
        }, {}),
        // Add default values for email fields
        sendEmailCopy: false,
        userEmail: "",
      };

      form.reset(defaultValues);
    }
  }, [template, existingForm, form]);

  // Set form values when data is loaded
  useEffect(() => {
    if (template?.questions && existingForm?.answers) {
      const defaultValues = template.questions.reduce(
        (values: Record<string, any>, question: any) => {
          const answer = existingForm?.answers.find((a: { questionId: number; value: string }) => a.questionId === question.id);
          if (answer) {
            if (question.questionType === "CHECKBOX" && question.options?.length > 0) {
              try {
                values[`question_${question.id}`] = JSON.parse(answer.value);
              } catch {
                values[`question_${question.id}`] = [answer.value];
              }
            } else if (question.questionType === "INTEGER") {
              values[`question_${question.id}`] = parseInt(answer.value);
            } else if (question.questionType === "CHECKBOX") {
              values[`question_${question.id}`] = answer.value === "true";
            } else {
              values[`question_${question.id}`] = answer.value;
            }
          } else {
            // Set default empty values for questions without answers
            if (question.questionType === "CHECKBOX" && question.options?.length > 0) {
              values[`question_${question.id}`] = [];
            } else if (question.questionType === "CHECKBOX") {
              values[`question_${question.id}`] = false;
            } else {
              values[`question_${question.id}`] = "";
            }
          }
          return values;
        },
        {
          // Add default values for email fields
          sendEmailCopy: false,
          userEmail: "",
        }
      );

      form.reset(defaultValues);
    } else if (template?.questions) {
      // Set empty defaults if no existing form
      const defaultValues = template.questions.reduce(
        (values: Record<string, any>, question: any) => {
          if (question.questionType === "CHECKBOX" && question.options?.length > 0) {
            values[`question_${question.id}`] = [];
          } else if (question.questionType === "CHECKBOX") {
            values[`question_${question.id}`] = false;
          } else {
            values[`question_${question.id}`] = "";
          }
          return values;
        },
        {
          // Add default values for email fields
          sendEmailCopy: false,
          userEmail: "",
        }
      );

      form.reset(defaultValues);
    }
  }, [template, existingForm, form]);

  const submitForm = useMutation({
    mutationFn: async (values: FormValues) => {
      const { authenticatedApi } = await createAuthenticatedApi(getToken);

      // Extract question answers
      const answers = Object.entries(values)
        .filter(([key]) => key.startsWith("question_")) // Only process question fields
        .map(([key, value]) => {
          const questionId = key.replace("question_", "");
          return {
            questionId: parseInt(questionId),
            value: Array.isArray(value) ? JSON.stringify(value) : value.toString(),
          };
        });

      // Create the payload with the email notification preferences
      const payload = {
        templateId: parseInt(id!),
        answers,
        sendEmailCopy: values.sendEmailCopy || false,
        userEmail: values.sendEmailCopy ? values.userEmail : null,
      };

      const response = await authenticatedApi.post("common.fFill./forms/fill", payload);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(existingForm ? t("common.fFill.Form updated successfully") : t("common.fFill.Form submitted successfully"));
      // navigate("/forms");
      navigate(`/forms/${data.formId}`, { state: { success: true } });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || t("common.fFill.Failed to submit form"));
    },
  });

  const handleDelete = useMutation({
    mutationFn: async () => {
      const { authenticatedApi } = await createAuthenticatedApi(getToken);

      await authenticatedApi.delete(`/forms/delete/${existingForm?.id}`);
    },
    onSuccess: () => {
      toast.success(t("common.fFill.Form deleted successfully"));
      navigate("/templates");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || t("common.fFill.Failed to delete form"));
    },
  });

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
          <CardTitle>{template.title}</CardTitle>
          {existingForm && (
            <div className="text-sm text-muted-foreground">
              {t("common.fFill.You submitted this form on")} {new Date(existingForm.createdAt).toLocaleDateString()}{" "}
              <Button variant={"link"} className="ml-3 text-red-500" onClick={() => handleDelete.mutate()}>
                {t("common.fFill.Delete your Submission?")}
              </Button>
            </div>
          )}
          {/* {template.description && <CardDescription className="whitespace-pre-line">{template.description}</CardDescription>} */}
          {template.description && (
            <div data-color-mode={theme} className="prose max-w-none">
              <MDEditor.Markdown source={template.description} />
            </div>
          )}
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit((values) => submitForm.mutate(values))} className="space-y-6">
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
                        return <Input id={`question_${question.id}`} {...field} />;
                      case "TEXT":
                        return <Textarea id={`question_${question.id}`} {...field} />;
                      case "INTEGER":
                        return <Input id={`question_${question.id}`} type="number" value={field.value || ""} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />;
                      case "CHECKBOX":
                        if (question.options?.length > 0) {
                          // Multiple choice (checkbox group)
                          return (
                            <div className="space-y-2">
                              {question.options.map((option: string) => (
                                <div key={option} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`${question.id}_${option}`}
                                    checked={field.value?.includes(option)}
                                    onCheckedChange={(checked) => {
                                      const currentValues = field.value || [];
                                      return checked ? field.onChange([...currentValues, option]) : field.onChange(currentValues.filter((v: string) => v !== option));
                                    }}
                                  />
                                  <Label htmlFor={`${question.id}_${option}`}>{option}</Label>
                                </div>
                              ))}
                            </div>
                          );
                        } else {
                          // Single checkbox
                          return (
                            <div className="flex items-center space-x-2">
                              <Checkbox id={`question_${question.id}`} checked={field.value} onCheckedChange={field.onChange} />
                              <Label htmlFor={`question_${question.id}`}>{t("common.fFill.Yes")}</Label>
                            </div>
                          );
                        }
                      default:
                        return <></>;
                    }
                  }}
                />
                {form.formState.errors[`question_${question.id}`]?.message && <p className="text-sm text-destructive">{String(form.formState.errors[`question_${question.id}`]?.message)}</p>}
              </div>
            ))}
            <div className="border-t mt-6 pt-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendEmailCopy"
                    checked={form.watch("sendEmailCopy") || false}
                    onCheckedChange={(checked) => {
                      form.setValue("sendEmailCopy", checked);
                      if (!checked) {
                        form.setValue("userEmail", "");
                      }
                    }}
                  />
                  <Label htmlFor="sendEmailCopy">{t("common.fFill.Send me a copy of my submission")}</Label>
                </div>

                {form.watch("sendEmailCopy") && (
                  <div className="space-y-2">
                    <Label htmlFor="userEmail">{t("common.fFill.Email address")}</Label>
                    <Input
                      id="userEmail"
                      type="email"
                      placeholder="your@email.com"
                      {...form.register("userEmail", {
                        required: form.watch("sendEmailCopy") ? "Email is required when requesting a copy" : false,
                        pattern: {
                          value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                          message: "Please enter a valid email address",
                        },
                      })}
                    />
                    {form.formState.errors.userEmail && <p className="text-sm text-destructive">{String(form.formState.errors.userEmail.message)}</p>}
                  </div>
                )}
              </div>
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex justify-end">
          <Button onClick={form.handleSubmit((values) => submitForm.mutate(values))} disabled={submitForm.isPending}>
            {submitForm.isPending ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-white"></span>
                {existingForm ? t("common.fFill.Updating...") : t("common.fFill.Submitting...")}
              </>
            ) : existingForm ? (
              t("common.fFill.Update Form")
            ) : (
              t("common.fFill.Submit Form")
            )}
          </Button>
        </CardFooter>
      </Card>
      {id && <Comments templateId={parseInt(id, 10)} />}
    </div>
  );
};

export default FormFill;

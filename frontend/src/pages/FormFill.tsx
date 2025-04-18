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
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { createAuthenticatedApi } from "@/lib/api";
import { useAuth } from "@clerk/clerk-react";

const FormFill = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();

  // Fetch template data
  const {
    data: template,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["templates", id, "fill"],
    queryFn: async () => {
      const { authenticatedApi } = await createAuthenticatedApi(getToken);
      const response = await authenticatedApi.get(`/form-process/fill/${id}`);
      return response.data;
    },
    retry: false,
  });

  // Generate dynamic schema based on template questions
  const formSchema = z.object(
    template?.questions?.reduce((acc: Record<string, any>, question: any) => {
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
    }, {}) || {}
  );

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: template?.questions?.reduce((values: Record<string, any>, question: any) => {
      if (question.questionType === "CHECKBOX" && question.options?.length > 0) {
        values[`question_${question.id}`] = [];
      } else if (question.questionType === "CHECKBOX") {
        values[`question_${question.id}`] = false;
      } else {
        values[`question_${question.id}`] = "";
      }
      return values;
    }, {}),
  });

  // Form submission mutation
  const submitForm = useMutation({
    mutationFn: async (values: FormValues) => {
      const { authenticatedApi } = await createAuthenticatedApi(getToken);

      const answers = template.questions.map((question: any) => {
        const value = values[`question_${question.id}`];
        return {
          questionId: question.id,
          value: Array.isArray(value) ? value.join(",") : String(value),
        };
      });

      const response = await authenticatedApi.post("/form-process/fill", {
        templateId: id,
        answers,
      });
      return response.data;
    },
    onSuccess: (data) => {
      // console.log("Form submitted successfully:", data);
      toast.success("Form submitted successfully");
      navigate(`/forms/${data.formId}`, { state: { success: true } });
    },
    onError: (error: any) => {
      console.error("Error submitting form:", error);
      toast.error(error || "Failed to submit form");
    },
  });

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8 space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6 space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-4xl py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{(error as any)?.response?.data?.error || "Failed to load form"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="container max-w-4xl py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Form template not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>{template.title}</CardTitle>
          {template.description && <CardDescription className="whitespace-pre-line">{template.description}</CardDescription>}
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
                        return <Input id={`question_${question.id}`} type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />;
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
                              <Label htmlFor={`question_${question.id}`}>Yes</Label>
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
          </form>
        </CardContent>

        <CardFooter className="flex justify-end">
          <Button onClick={form.handleSubmit((values) => submitForm.mutate(values))} disabled={submitForm.isPending}>
            {submitForm.isPending ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-white"></span>
                Submitting...
              </>
            ) : (
              "Submit Form"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default FormFill;

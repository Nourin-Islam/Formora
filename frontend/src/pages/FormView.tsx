import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import SmallSkeleton from "@/components/global/SmallSkeleton";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { createAuthenticatedApi } from "@/lib/api";
import { useAuth } from "@clerk/clerk-react";
import { Icons } from "@/components/global/icons";

const FormView = () => {
  const { id } = useParams();
  const location = useLocation();
  const { getToken } = useAuth();
  const success = location.state?.success;
  const navigate = useNavigate();

  const {
    data: form,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["forms", id],
    queryFn: async () => {
      const { authenticatedApi } = await createAuthenticatedApi(getToken);
      const response = await authenticatedApi.get(`/form-process/view/${id}`);
      return response.data;
    },
    retry: false,
  });

  const handleDelete = async () => {
    const { authenticatedApi } = await createAuthenticatedApi(getToken);
    await authenticatedApi.delete(`/form-process/delete/${id}`);
    toast.success("Form deleted successfully");
    navigate("/templates");
  };

  if (success) {
    toast.success("Form submitted successfully");
  }

  if (isLoading) {
    return <SmallSkeleton />;
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

  if (!form) {
    return (
      <div className="container max-w-4xl py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Form not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{form.template.title}</CardTitle>
              <CardDescription className="mt-2">
                Filled by {form.user.name} on {format(new Date(form.createdAt), "PPPpp")}
              </CardDescription>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" className="ml-auto cursor-pointer" onClick={() => navigate(`/fill-form/${form.template.id}`)}>
                  <Icons.eye className="h-4 w-4" />
                  <span className="sr-only">View Template</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>View Template</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" className="mx-3 cursor-pointer" onClick={() => navigate(`/fill-form/${form.template.id}`)}>
                  <Icons.edit className="h-4 w-4" />
                  <span className="sr-only">Edit Answers</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit Answers</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="destructive" className="cursor-pointer" onClick={handleDelete}>
                  <Icons.trash className="h-4 w-4" />
                  <span className="sr-only">Delete Answers</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete Answers</TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6 space-y-6">
          {form.answers.map((answer: any) => (
            <div key={answer.id} className="space-y-2">
              <h3 className="text-lg font-medium">{answer.question.title}</h3>
              {answer.question.description && <p className="text-sm text-muted-foreground">{answer.question.description}</p>}

              <div className="mt-2">{answer.question.questionType === "CHECKBOX" ? <Badge variant={answer.value === "true" ? "default" : "secondary"}>{answer.value === "true" ? "Yes" : "No"}</Badge> : <p className="text-base">{answer.value}</p>}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default FormView;

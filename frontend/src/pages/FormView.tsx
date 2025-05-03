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
import { Eye, FilePenIcon, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import useSEO from "@/hooks/useSEO";
import ErrorReload from "@/components/global/ErrorReload";

const FormView = () => {
  useSEO({
    title: "Formora: Form View",
    description: "View the details of your submitted form.",
    keywords: "privacy, data protection, Formora",
  });

  const { id } = useParams();
  const location = useLocation();
  const { getToken } = useAuth();
  const success = location.state?.success;
  const navigate = useNavigate();
  const { t } = useTranslation("common");

  const {
    data: form,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["forms", id],
    queryFn: async () => {
      const { authenticatedApi } = await createAuthenticatedApi(getToken);
      const response = await authenticatedApi.get(`/forms/view/${id}`);
      return response.data;
    },
    retry: false,
  });

  // console.log("Form data", form);

  const handleDelete = async () => {
    const { authenticatedApi } = await createAuthenticatedApi(getToken);
    await authenticatedApi.delete(`/forms/delete/${id}`);
    toast.success(t("common.fView.Form deleted successfully"));
    navigate("/templates");
  };

  if (success) {
    toast.success(t("common.fView.Form submitted successfully"));
  }

  if (isLoading) {
    return <SmallSkeleton />;
  }

  if (error) return <ErrorReload error={error} />;

  if (!form) {
    return (
      <div className="container max-w-4xl py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t("common.fView.Form not found")}</AlertDescription>
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
                {t("common.fView.Filled by")} {form.user.name} {t("common.fView.on")} {format(new Date(form.createdAt), "PPPpp")}
              </CardDescription>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" className="ml-auto cursor-pointer" onClick={() => navigate(`/check-form/${form.template.id}`)}>
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">{t("common.fView.View Template")}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("common.fView.View Template")}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" className="mx-3 cursor-pointer" onClick={() => navigate(`/check-form/${form.template.id}`)}>
                  <FilePenIcon className="h-4 w-4" />
                  <span className="sr-only">{t("common.fView.Edit Answers")}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("common.fView.Edit Answers")}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="destructive" className="cursor-pointer" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">{t("common.fView.Delete Answers")}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("common.fView.Delete Answers")}</TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6 space-y-6">
          {form.answers.map((answer: any) => (
            <div key={answer.id} className="space-y-2">
              <h3 className="text-lg font-medium">{answer.question.title}</h3>
              {answer.question.description && <p className="text-sm text-muted-foreground">{answer.question.description}</p>}

              {answer.question.questionType === "CHECKBOX" ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {JSON.parse(answer.value).map((val: string, index: number) => (
                    <Badge key={index} variant="default" className="text-sm">
                      {val}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-base">{answer.value}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default FormView;

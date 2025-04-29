import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { createAuthenticatedApi } from "@/lib/api";
import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { useState } from "react";
import { Eye } from "lucide-react";
import SmallSkeleton from "@/components/global/SmallSkeleton";
import { useTranslation } from "react-i18next";
import ErrorReload from "@/components/global/ErrorReload";

interface FormResponse {
  form_id: number;
  template_title: string;
  template_creator_name: string;
  template_question_count: number;
  template_submission_count: number;
  submission_date: string;
}

function UserAllResponses() {
  const { t } = useTranslation("common");
  const { getToken } = useAuth();
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const {
    data: formResponses,
    isLoading,
    error,
  } = useQuery<FormResponse[]>({
    queryKey: ["my-form-responses"],
    queryFn: async () => {
      const { authenticatedApi } = await createAuthenticatedApi(getToken);
      const response = await authenticatedApi.get(`/forms/my-responses`);
      return response.data;
    },
    retry: false,
  });

  // Sort responses by submission date
  const sortedResponses = formResponses
    ? [...formResponses].sort((a, b) => {
        const aDate = new Date(a.submission_date).getTime();
        const bDate = new Date(b.submission_date).getTime();
        return sortDirection === "asc" ? aDate - bDate : bDate - aDate;
      })
    : [];

  if (isLoading) return <SmallSkeleton />;

  if (error) return <ErrorReload error={error} />;

  if (sortedResponses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("common.uAllResponses.My Form Responses")}</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-gray-500">{t("common.uAllResponses.No responses yet")}</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("common.uAllResponses.My Form Responses")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" onClick={() => setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))} className="p-0 hover:bg-transparent">
                  {t("common.uAllResponses.Submitted")}
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>{t("common.uAllResponses.Template")}</TableHead>
              <TableHead>{t("common.uAllResponses.Creator")}</TableHead>
              <TableHead>{t("common.uAllResponses.Questions")}</TableHead>
              <TableHead>{t("common.uAllResponses.Total Submissions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedResponses.map((response) => (
              <TableRow key={response.form_id}>
                <TableCell>{format(new Date(response.submission_date), "MMM dd, yyyy HH:mm")}</TableCell>
                <TableCell>
                  <Link to={`/forms/${response.form_id}`} className="text-primary hover:underline flex items-center group">
                    {response.template_title}
                    <Eye className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </TableCell>
                <TableCell>{response.template_creator_name}</TableCell>
                <TableCell>{response.template_question_count}</TableCell>
                <TableCell>{response.template_submission_count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default UserAllResponses;

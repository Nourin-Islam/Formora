import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { createAuthenticatedApi } from "@/lib/api";
import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { useState, useMemo } from "react";
import SmallSkeleton from "@/components/global/SmallSkeleton";
import { useTranslation } from "react-i18next";
import { Eye } from "lucide-react";
import ErrorReload from "@/components/global/ErrorReload";

interface SubmissionRow {
  form_id: number;
  templateId: number;
  user_id: number;
  user_name: string;
  submission_date: string;
  question_id: number;
  question_title: string;
  question_type: "STRING" | "TEXT" | "INTEGER" | "CHECKBOX";
  show_in_table: boolean;
  answer: string;
}

function TemplatesPreviousSubmissions({ id }: { id: string }) {
  const { t } = useTranslation("common");
  const { getToken } = useAuth();
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const {
    data: rawSubmissions,
    isLoading,
    error,
  } = useQuery<SubmissionRow[]>({
    queryKey: ["form-submissions", id],
    queryFn: async () => {
      const { authenticatedApi } = await createAuthenticatedApi(getToken);
      const response = await authenticatedApi.get(`/forms/of-template/${id}`);
      return response.data;
    },
    retry: false,
  });

  // 🎯 Utility function to format answer for CHECKBOX/INTEGER
  function formatAnswer(answer: string, type: string) {
    if (type === "CHECKBOX") {
      try {
        const parsed = JSON.parse(answer);
        return Array.isArray(parsed) ? parsed.join(", ") : answer;
      } catch {
        return answer;
      }
    }
    if (type === "INTEGER") {
      return isNaN(Number(answer)) ? t("common.subPrevious.Invalid") : answer;
    }
    return answer;
  }

  // 🧠 Group submissions by form
  const groupedSubmissions = useMemo(() => {
    const formMap: Record<
      number,
      {
        formId: number;
        userName: string;
        submissionDate: string;
        questions: Record<string, { answer: string; type: string }>;
      }
    > = {};

    rawSubmissions?.forEach((row) => {
      if (!row.show_in_table) return;

      if (!formMap[row.form_id]) {
        formMap[row.form_id] = {
          formId: row.form_id,
          userName: row.user_name,
          submissionDate: row.submission_date,
          questions: {},
        };
      }

      formMap[row.form_id].questions[row.question_title] = {
        answer: row.answer,
        type: row.question_type,
      };
    });

    return Object.values(formMap);
  }, [rawSubmissions]);

  // 🧠 Get all unique question titles (columns)
  const questionTitles = useMemo(() => {
    const titles = new Set<string>();
    rawSubmissions?.forEach((row) => {
      if (row.show_in_table) {
        titles.add(row.question_title);
      }
    });
    return Array.from(titles);
  }, [rawSubmissions]);

  // 🔁 Sorting
  const sortedSubmissions = [...groupedSubmissions].sort((a, b) => {
    const aDate = new Date(a.submissionDate).getTime();
    const bDate = new Date(b.submissionDate).getTime();
    return sortDirection === "asc" ? aDate - bDate : bDate - aDate;
  });

  if (isLoading) return <SmallSkeleton />;

  if (error) return <ErrorReload error={error} />;

  if (sortedSubmissions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("common.subPrevious.Previous Submissions")}</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-gray-500">{t("common.subPrevious.No submissions yet")}</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("common.subPrevious.Previous Submissions")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" onClick={() => setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))} className="p-0 hover:bg-transparent">
                  {t("common.subPrevious.Created")}
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>{t("common.subPrevious.User")}</TableHead>
              {questionTitles.map((title) => (
                <TableHead key={title}>{title}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSubmissions.map((submission) => (
              <TableRow key={submission.formId}>
                <TableCell>
                  <Link to={`/forms/${submission.formId}`} className="text-primary hover:underline flex items-center group">
                    {format(new Date(submission.submissionDate), "MMM dd, yyyy HH:mm")}
                    <Eye className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </TableCell>
                <TableCell>{submission.userName}</TableCell>
                {questionTitles.map((title) => {
                  const data = submission.questions[title];
                  return <TableCell key={title}>{data ? formatAnswer(data.answer, data.type) : "—"}</TableCell>;
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default TemplatesPreviousSubmissions;

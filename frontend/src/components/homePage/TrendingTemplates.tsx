import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@clerk/clerk-react";

import { Eye, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { usePopularTemplates } from "@/hooks/useTemplates";
import SmallSkeleton from "@/components/global/SmallSkeleton";
import ErrorReload from "@/components/global/ErrorReload";

type SortField = "title" | "createdAt" | "topic" | "likesCount" | "questionCount" | "submissionCount" | "user";

export default function TrendingTemplatesSection() {
  const { t } = useTranslation("common");
  const { userId } = useAuth();
  const [sortConfig, setSortConfig] = useState<{
    field: SortField;
    direction: "asc" | "desc";
  }>({ field: "createdAt", direction: "desc" });

  // Data fetching
  const { data: templatesData, isLoading, isError, error } = usePopularTemplates();

  // Sort templates
  const sortedTemplates = [...(templatesData?.templates || [])].sort((a, b) => {
    let valueA, valueB;

    switch (sortConfig.field) {
      case "title":
        valueA = a.title.toLowerCase();
        valueB = b.title.toLowerCase();
        break;
      case "topic":
        valueA = a.topic?.name?.toLowerCase() || "";
        valueB = b.topic?.name?.toLowerCase() || "";
        break;
      case "user":
        valueA = a.user?.name?.toLowerCase() || "";
        valueB = b.user?.name?.toLowerCase() || "";
        break;
      case "submissionCount":
        valueA = a.submissionCount || 0;
        valueB = b.submissionCount || 0;
        break;
      default:
        valueA = a[sortConfig.field];
        valueB = b[sortConfig.field];
    }

    if (valueA < valueB) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (valueA > valueB) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });

  const requestSort = (field: SortField) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.field === field && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ field, direction });
  };

  // Loading and error states
  if (isLoading) return <SmallSkeleton />;

  if (isError) return <ErrorReload error={error} />;

  return (
    <div className="">
      <h1 className="text-2xl font-bold mb-6 text-center">🔥 {t("common.home.trending.title.trendingTemplates")}</h1>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestSort("title")} className="p-0 hover:bg-transparent">
                    {t("common.home.trending.column.title")}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestSort("createdAt")} className="p-0 hover:bg-transparent">
                    {t("common.home.trending.column.created")}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestSort("topic")} className="p-0 hover:bg-transparent">
                    {t("common.home.trending.column.topic")}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestSort("likesCount")} className="p-0 hover:bg-transparent">
                    {t("common.home.trending.column.likes")}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestSort("questionCount")} className="p-0 hover:bg-transparent">
                    {t("common.home.trending.column.questions")}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestSort("submissionCount")} className="p-0 hover:bg-transparent">
                    {t("common.home.trending.column.submissions")}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestSort("user")} className="p-0 hover:bg-transparent">
                    {t("common.home.trending.column.creator")}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTemplates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <Link to={userId ? `/check-form/${template.id}` : `/view-template/${template.id}`} className="text-primary hover:underline flex items-center group">
                      {template.title.length > 30 ? `${template.title.slice(0, 30)}...` : template.title}
                      <Eye className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </TableCell>
                  <TableCell>{format(new Date(template.createdAt), "MMM dd, yyyy HH:mm")}</TableCell>
                  <TableCell>{template.topic?.name || t("common.home.trending.common.empty")}</TableCell>
                  <TableCell>{template.likesCount}</TableCell>
                  <TableCell>{template.questionCount}</TableCell>
                  <TableCell>{(template as any).submissionCount || 0}</TableCell>
                  <TableCell>{template.user?.name || t("common.home.trending.common.empty")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

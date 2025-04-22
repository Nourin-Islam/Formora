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
import { Icons } from "../components/global/icons";
import SmallSkeleton from "@/components/global/SmallSkeleton";

interface Submission {
  formId: number;
  userName: string;
  createdAt: string;
  updatedAt: string;
  scorePercentage: number | null;
}

function PreviousSubmissions({ id }: { id: string }) {
  const { getToken } = useAuth();
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Submission;
    direction: "asc" | "desc";
  }>({ key: "createdAt", direction: "desc" });

  const {
    data: submissions,
    isLoading,
    error,
  } = useQuery<Submission[]>({
    queryKey: ["submissions", id],
    queryFn: async () => {
      const { authenticatedApi } = await createAuthenticatedApi(getToken);
      const response = await authenticatedApi.get(`/forms/of-template/${id}`);
      return response.data;
    },
    retry: false,
  });

  const handleSort = (key: keyof Submission) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedSubmissions = submissions?.sort((a, b) => {
    if (a[sortConfig.key] === null) return 1;
    if (b[sortConfig.key] === null) return -1;
    // @ts-ignore
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    // @ts-ignore
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });

  if (isLoading) {
    return <SmallSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Previous Submissions</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-red-500">Failed to load submissions</CardContent>
      </Card>
    );
  }

  if (!sortedSubmissions || sortedSubmissions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Previous Submissions</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-gray-500">No submissions yet</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Previous Submissions</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("formId")} className="p-0 hover:bg-transparent">
                  Form ID
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>User</TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("createdAt")} className="p-0 hover:bg-transparent">
                  Created
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("updatedAt")} className="p-0 hover:bg-transparent">
                  Last Updated
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("scorePercentage")} className="p-0 hover:bg-transparent">
                  Score
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSubmissions.map((submission) => (
              <TableRow key={submission.formId}>
                <TableCell className="  flex items-center justify-center">
                  <Link to={`/forms/${submission.formId}`} className="text-primary hover:underline flex items-center group">
                    {submission.formId}
                    <Icons.eye className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </TableCell>
                <TableCell>{submission.userName}</TableCell>
                <TableCell>{format(new Date(submission.createdAt), "MMM dd, yyyy HH:mm")}</TableCell>
                <TableCell>{format(new Date(submission.updatedAt), "MMM dd, yyyy HH:mm")}</TableCell>
                <TableCell className="  flex items-center justify-center">{submission.scorePercentage !== null ? <span className={submission.scorePercentage >= 75 ? "text-green-500" : submission.scorePercentage >= 50 ? "text-yellow-500" : "text-red-500"}>{submission.scorePercentage}%</span> : <span className="text-gray-500">N/A</span>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default PreviousSubmissions;

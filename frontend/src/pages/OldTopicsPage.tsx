import { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable, ColumnFiltersState, getFilteredRowModel } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { Icons } from "@/components/global/icons";
import { useAuth } from "@clerk/clerk-react";
import LoadingSpinner from "@/components/global/LoadingSpinner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";

// Define the Topic type based on your backend
type Topic = {
  id: number;
  name: string;
};

// Form schema for topic creation/editing
const topicFormSchema = z.object({
  name: z.string().min(2, {
    message: "Topic name must be at least 2 characters.",
  }),
});

export const columns: ColumnDef<Topic>[] = [
  {
    id: "select",
    header: ({ table }) => <Checkbox checked={table.getIsAllPageRowsSelected()} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} aria-label="Select all" />,
    cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />,
    enableSorting: false,
  },
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
];

export default function ManageTopicsTable() {
  const { getToken } = useAuth();
  const [nameFilter, setNameFilter] = useState("");
  const [debouncedNameFilter] = useDebounce(nameFilter, 700);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  });
  const [rowSelection, setRowSelection] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);
  const queryClient = useQueryClient();
  type TopicsResponse = {
    topics: Topic[];
    totalPages: number;
    hasNextPage: boolean;
  };

  const queryKey = ["topics", pagination.pageIndex, pagination.pageSize, sorting, columnFilters];

  const { data, isLoading, isError, error } = useQuery<TopicsResponse, Error>({
    queryKey,
    queryFn: async () => {
      const token = await getToken();

      const params = new URLSearchParams({
        page: (pagination.pageIndex + 1).toString(),
        limit: pagination.pageSize.toString(),
        sortBy: sorting[0]?.id || "name",
        sortOrder: sorting[0]?.desc ? "desc" : "asc",
        ...(columnFilters.find((f) => f.id === "name") && {
          name: columnFilters.find((f) => f.id === "name")?.value as string,
        }),
      });

      const response = await fetch(`http://localhost:3000/api/topics?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to fetch topics");
      }

      const responseData = await response.json();
      console.log("API Response:", responseData);

      return responseData;
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  // Prefetch the next page if it exists
  useEffect(() => {
    if (data?.hasNextPage) {
      const nextPage = pagination.pageIndex + 1;
      const params = new URLSearchParams({
        page: (nextPage + 1).toString(),
        limit: pagination.pageSize.toString(),
        sortBy: sorting[0]?.id || "name",
        sortOrder: sorting[0]?.desc ? "desc" : "asc",
        ...(columnFilters.find((f) => f.id === "name") && {
          name: columnFilters.find((f) => f.id === "name")?.value as string,
        }),
      });

      queryClient.prefetchQuery({
        queryKey: ["topics", nextPage, pagination.pageSize, sorting, columnFilters],
        queryFn: async () => {
          const token = await getToken();
          const res = await fetch(`http://localhost:3000/api/topics?${params}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (!res.ok) throw new Error("Failed to fetch topics");
          return res.json();
        },
      });
    }
  }, [data, pagination, sorting, columnFilters, queryClient]);

  // Set column filter whenever debounced input changes
  useEffect(() => {
    table.getColumn("name")?.setFilterValue(debouncedNameFilter);
  }, [debouncedNameFilter]);

  const table = useReactTable({
    data: data?.topics || [],
    columns,
    pageCount: data?.totalPages || 1,
    state: {
      sorting,
      columnFilters,
      pagination,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
  });

  // Form for create/edit
  const form = useForm<z.infer<typeof topicFormSchema>>({
    resolver: zodResolver(topicFormSchema),
    defaultValues: {
      name: currentTopic?.name || "",
    },
  });

  // Reset form when currentTopic changes
  useEffect(() => {
    if (currentTopic) {
      form.reset({
        name: currentTopic.name,
      });
    } else {
      form.reset({
        name: "",
      });
    }
  }, [currentTopic, form]);

  const handleCreateTopic = async (values: z.infer<typeof topicFormSchema>) => {
    setIsUpdating(true);
    try {
      const token = await getToken();
      const response = await fetch("http://localhost:3000/api/topics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error("Failed to create topic");

      toast.success("Topic created successfully");
      queryClient.invalidateQueries({ queryKey: ["topics"] });
      setIsCreateDialogOpen(false);
      form.reset();
    } catch (error) {
      toast.error("Failed to create topic");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateTopic = async (values: z.infer<typeof topicFormSchema>) => {
    if (!currentTopic) return;

    setIsUpdating(true);
    try {
      const token = await getToken();
      const response = await fetch(`http://localhost:3000/api/topics/${currentTopic.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error("Failed to update topic");

      toast.success("Topic updated successfully");
      queryClient.invalidateQueries({ queryKey: ["topics"] });
      setIsEditDialogOpen(false);
      setCurrentTopic(null);
    } catch (error) {
      toast.error("Failed to update topic");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTopic = async (topicId: number) => {
    setIsUpdating(true);
    try {
      const token = await getToken();
      const response = await fetch(`http://localhost:3000/api/topics/${topicId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete topic");

      toast.success("Topic deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["topics"] });
      setIsDeleteDialogOpen(false);
      setCurrentTopic(null);
    } catch (error) {
      toast.error("Failed to delete topic");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    const selectedTopicIds = table.getSelectedRowModel().rows.map((row) => row.original.id);

    // Early return if nothing to delete
    if (selectedTopicIds.length === 0) {
      setIsDeleteDialogOpen(false);
      return;
    }

    setIsUpdating(true);

    try {
      const token = await getToken();
      await Promise.all(
        selectedTopicIds.map(async (topicId) => {
          const response = await fetch(`http://localhost:3000/api/topics/${topicId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (!response.ok) throw new Error(`Failed to delete topic ${topicId}`);
        })
      );

      toast.success(`${selectedTopicIds.length} topics deleted successfully`);
      queryClient.invalidateQueries({ queryKey: ["topics"] });

      // Clear selections and close dialog
      table.resetRowSelection();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to delete some topics");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError) {
    console.error("Error loading topics:", error);
    return (
      <div className="text-red-500">
        Error loading topics: {error.message}
        <Button variant="outline" onClick={() => queryClient.refetchQueries({ queryKey })}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          {/* Create Topic Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentTopic(null);
                  setIsCreateDialogOpen(true);
                }}
              >
                <Icons.plus className="h-4 w-4 mr-2" />
                Create Topic
              </Button>
            </TooltipTrigger>
            <TooltipContent>Create a new topic</TooltipContent>
          </Tooltip>

          {/* Edit Selected Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const selectedTopics = table.getSelectedRowModel().rows;
                  if (selectedTopics.length === 1) {
                    setCurrentTopic(selectedTopics[0].original);
                    setIsEditDialogOpen(true);
                  }
                }}
                disabled={table.getSelectedRowModel().rows.length !== 1}
              >
                <Icons.edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit selected topic</TooltipContent>
          </Tooltip>

          {/* Delete Selected Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (table.getSelectedRowModel().rows.length === 1) {
                    setCurrentTopic(table.getSelectedRowModel().rows[0].original);
                  }
                  setIsDeleteDialogOpen(true);
                }}
                disabled={table.getSelectedRowModel().rows.length === 0}
              >
                {isUpdating ? <Icons.spinner className="h-4 w-4 mr-2 animate-spin" /> : <Icons.trash className="h-4 w-4 mr-2" />}
                Delete
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete selected topics</TooltipContent>
          </Tooltip>
        </div>

        <Input placeholder="Filter topics..." value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} className="max-w-sm" />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              Previous
            </Button>
          </PaginationItem>
          <PaginationItem>
            <span className="text-sm">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
          </PaginationItem>
          <PaginationItem>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Next
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      {/* Create Topic Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Topic</DialogTitle>
            <DialogDescription>Add a new topic to the system.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateTopic)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topic Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter topic name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating && <Icons.spinner className="h-4 w-4 mr-2 animate-spin" />}
                  Create Topic
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Topic Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Topic</DialogTitle>
            <DialogDescription>Make changes to the topic.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateTopic)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topic Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter topic name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating && <Icons.spinner className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>{currentTopic ? `Are you sure you want to delete the topic "${currentTopic.name}"?` : `Are you sure you want to delete ${table.getSelectedRowModel().rows.length} selected topics?`}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (currentTopic) {
                  handleDeleteTopic(currentTopic.id);
                } else {
                  handleBulkDelete();
                }
              }}
              disabled={isUpdating}
            >
              {isUpdating && <Icons.spinner className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

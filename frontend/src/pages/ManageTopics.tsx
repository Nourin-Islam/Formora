import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, useReactTable, getFilteredRowModel } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { FilePenIcon, Plus, Shell, Trash2 } from "lucide-react";
import LoadingSpinner from "@/components/global/LoadingSpinner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { topicFormSchema } from "@/types";
import { Topic } from "@/hooks/useTopics";
import { useTopics, useCreateTopic, useUpdateTopic, useDeleteTopic, useBulkDeleteTopics } from "@/hooks/useTopics";

import useSEO from "@/hooks/useSEO";
import ErrorReload from "@/components/global/ErrorReload";

export const columns: ColumnDef<Topic, any>[] = [
  {
    id: "select",
    header: ({ table }) => <Checkbox checked={table.getIsAllPageRowsSelected()} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} aria-label="Select all" />,
    cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />,
    enableSorting: false,
  },
  {
    accessorKey: "id",
    header: "ID",
    accessorFn: (row) => row.id,
  },
  {
    accessorKey: "name",
    header: "Name",
    accessorFn: (row) => row.name,
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
];

export default function ManageTopics() {
  useSEO({
    title: "Formora: Manage Topics",
    description: "Manage your topics effectively with Formora.",
    keywords: "topics, management, Formora",
  });

  // State for table controls
  const [nameFilter, setNameFilter] = useState("");
  const [debouncedNameFilter] = useDebounce(nameFilter, 700);
  const [sorting, setSorting] = useState([{ id: "name", desc: false }]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  });
  const [rowSelection, setRowSelection] = useState({});
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch topics
  const { data, isLoading, isError, error } = useTopics({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    sortBy: sorting[0]?.id,
    sortOrder: sorting[0]?.desc ? "desc" : "asc",
    name: debouncedNameFilter || undefined,
  });

  // Mutations
  const createTopic = useCreateTopic();
  const updateTopic = useUpdateTopic();
  const deleteTopic = useDeleteTopic();
  const bulkDeleteTopics = useBulkDeleteTopics();

  const form = useForm({
    resolver: zodResolver(topicFormSchema),
    defaultValues: {
      name: currentTopic?.name || "",
    },
  });

  // Reset form when currentTopic changes
  useEffect(() => {
    form.reset({
      name: currentTopic?.name || "",
    });
  }, [currentTopic, form]);

  const table = useReactTable({
    data: data?.topics || [],
    columns,
    pageCount: data?.totalPages || 1,
    state: {
      sorting,
      columnFilters: nameFilter ? [{ id: "name", value: nameFilter }] : [],
      pagination,
      rowSelection,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
  });

  const handleCreateTopic = async (values: { name: string }) => {
    try {
      await createTopic.mutateAsync(values);
      toast.success("Topic created successfully");
      form.reset();
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast.error("Failed to create topic");
    }
  };

  const handleUpdateTopic = async (values: { name: string }) => {
    if (!currentTopic) return;

    try {
      await updateTopic.mutateAsync({ id: currentTopic.id, values });
      toast.success("Topic updated successfully");
      form.reset();
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error("Failed to update topic");
    }
  };

  const handleDeleteTopic = async () => {
    if (!currentTopic) return;

    try {
      await deleteTopic.mutateAsync(currentTopic.id);
      toast.success("Topic deleted successfully");
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to delete topic");
    }
  };

  const handleBulkDelete = async () => {
    const selectedTopicIds = table.getSelectedRowModel().rows.map((row) => row.original.id);

    if (selectedTopicIds.length === 0) {
      setIsDeleteDialogOpen(false);
      return;
    }

    try {
      await bulkDeleteTopics.mutateAsync(selectedTopicIds);
      toast.success(`${selectedTopicIds.length} topics deleted successfully`);
      setIsDeleteDialogOpen(false);
      setRowSelection({});
    } catch (error) {
      toast.error("Failed to delete some topics");
    }
  };

  if (isLoading) return <LoadingSpinner />;

  if (isError) return <ErrorReload error={error} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center flex-wrap justify-between gap-4">
        <div className="flex gap-2">
          {/* Create Topic Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
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
                <FilePenIcon className="h-4 w-4 mr-2" />
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
                  } else {
                    setCurrentTopic(null);
                  }
                  setIsDeleteDialogOpen(true);
                }}
                disabled={table.getSelectedRowModel().rows.length === 0}
              >
                {createTopic.isPending || updateTopic.isPending || deleteTopic.isPending || bulkDeleteTopics.isPending ? <Shell className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
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
              Page {pagination.pageIndex + 1} of {data?.totalPages || 1}
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
                <Button type="submit" disabled={createTopic.isPending}>
                  {createTopic.isPending && <Shell className="h-4 w-4 mr-2 animate-spin" />}
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
                <Button type="submit" disabled={updateTopic.isPending}>
                  {updateTopic.isPending && <Shell className="h-4 w-4 mr-2 animate-spin" />}
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
                  handleDeleteTopic();
                } else {
                  handleBulkDelete();
                }
              }}
              disabled={deleteTopic.isPending || bulkDeleteTopics.isPending}
            >
              {(deleteTopic.isPending || bulkDeleteTopics.isPending) && <Shell className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

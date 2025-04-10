import { useEffect } from "react";
import { useDebounce } from "use-debounce";
import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, useReactTable, getFilteredRowModel } from "@tanstack/react-table";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Topic, topicFormSchema, useTopicsStore } from "@/store/topicStore";

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

export default function ManageTopics() {
  const { getToken } = useAuth();
  const {
    // State
    topics,
    totalPages,
    nameFilter,
    sorting,
    pagination,
    rowSelection,
    isLoading,
    isError,
    errorMessage,
    isUpdating,
    isCreateDialogOpen,
    isEditDialogOpen,
    isDeleteDialogOpen,
    currentTopic,

    // Actions
    setNameFilter,
    setSorting,
    setPagination,
    setRowSelection,
    resetRowSelection,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    closeAllDialogs,
    fetchTopics,
    createTopic,
    updateTopic,
    deleteTopic,
    bulkDeleteTopics,
  } = useTopicsStore();

  const [debouncedNameFilter] = useDebounce(nameFilter, 700);

  // Fetch topics when dependencies change
  useEffect(() => {
    fetchTopics(getToken);
  }, [pagination.pageIndex, pagination.pageSize, sorting, debouncedNameFilter, fetchTopics, getToken]);

  const table = useReactTable({
    data: topics,
    columns,
    pageCount: totalPages,
    state: {
      sorting,
      columnFilters: nameFilter ? [{ id: "name", value: nameFilter }] : [],
      pagination,
      rowSelection,
    },
    onSortingChange: (updaterOrValue) => {
      if (Array.isArray(updaterOrValue)) {
        setSorting(updaterOrValue);
      } else {
        setSorting(updaterOrValue([]));
      }
    },
    onPaginationChange: (updaterOrValue) => {
      if (typeof updaterOrValue === "function") {
        setPagination(updaterOrValue({ pageIndex: pagination.pageIndex, pageSize: pagination.pageSize }));
      } else {
        setPagination(updaterOrValue);
      }
    },
    onRowSelectionChange: (updaterOrValue) => {
      if (typeof updaterOrValue === "function") {
        setRowSelection(updaterOrValue({}));
      } else {
        setRowSelection(updaterOrValue);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
  });

  // Form for create/edit
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

  interface CreateTopicValues {
    name: string;
  }

  const handleCreateTopic = async (values: CreateTopicValues): Promise<void> => {
    const success = await createTopic(values, getToken);
    if (success) {
      toast.success("Topic created successfully");
      form.reset();
    } else {
      toast.error("Failed to create topic");
    }
  };

  interface UpdateTopicValues {
    name: string;
  }

  const handleUpdateTopic = async (values: UpdateTopicValues): Promise<void> => {
    const success = await updateTopic(values, getToken);
    if (success) {
      toast.success("Topic updated successfully");
      form.reset();
    } else {
      toast.error("Failed to update topic");
    }
  };

  const handleDeleteTopic = async () => {
    if (!currentTopic) return;

    const success = await deleteTopic(currentTopic.id, getToken);
    if (success) {
      toast.success("Topic deleted successfully");
    } else {
      toast.error("Failed to delete topic");
    }
  };

  const handleBulkDelete = async () => {
    const selectedTopicIds = table.getSelectedRowModel().rows.map((row) => row.original.id);

    const success = await bulkDeleteTopics(selectedTopicIds, getToken);
    if (success) {
      toast.success(`${selectedTopicIds.length} topics deleted successfully`);
    } else {
      toast.error("Failed to delete some topics");
    }
  };

  if (isLoading) return <LoadingSpinner />;

  if (isError) {
    return (
      <div className="text-red-500">
        Error loading topics: {errorMessage}
        <Button variant="outline" onClick={() => fetchTopics(getToken)}>
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
              <Button variant="outline" size="sm" onClick={openCreateDialog}>
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
                    openEditDialog(selectedTopics[0].original);
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
                    openDeleteDialog(table.getSelectedRowModel().rows[0].original);
                  } else {
                    openDeleteDialog();
                  }
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
              Page {pagination.pageIndex + 1} of {totalPages}
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
      <Dialog open={isCreateDialogOpen} onOpenChange={closeAllDialogs}>
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
                <Button type="button" variant="outline" onClick={closeAllDialogs}>
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
      <Dialog open={isEditDialogOpen} onOpenChange={closeAllDialogs}>
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
                <Button type="button" variant="outline" onClick={closeAllDialogs}>
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
      <Dialog open={isDeleteDialogOpen} onOpenChange={closeAllDialogs}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>{currentTopic ? `Are you sure you want to delete the topic "${currentTopic.name}"?` : `Are you sure you want to delete ${table.getSelectedRowModel().rows.length} selected topics?`}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeAllDialogs}>
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

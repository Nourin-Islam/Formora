import { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, useReactTable, getFilteredRowModel } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { Icons } from "@/components/global/icons";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Tag, tagFormSchema } from "@/types";
import { useTags, useCreateTag, useUpdateTag, useDeleteTag, useBulkDeleteTags } from "@/hooks/useTags";
import SmallSkeleton from "@/components/global/SmallSkeleton";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";

export default function ManageTagsTable() {
  const { t } = useTranslation();
  const [nameFilter, setNameFilter] = useState("");
  const [debouncedNameFilter] = useDebounce(nameFilter, 700);
  const [sorting, setSorting] = useState([{ id: "name", desc: false }]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  });
  const [rowSelection, setRowSelection] = useState({});
  const [currentTag, setCurrentTag] = useState<Tag | null>(null);

  // Dialog states - replace Zustand actions
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Replace Zustand selectors with React Query
  const { data, isLoading, isError, error } = useTags({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    sortBy: sorting[0]?.id,
    sortOrder: sorting[0]?.desc ? "desc" : "asc",
    name: debouncedNameFilter || undefined,
  });

  // Replace Zustand actions with React Query mutations
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();
  const bulkDeleteTags = useBulkDeleteTags();

  // Replace Zustand's isUpdating with individual mutation states
  const isUpdating = createTag.isPending || updateTag.isPending || deleteTag.isPending || bulkDeleteTags.isPending;

  // Replace Zustand's totalPages with data from query
  const totalPages = data?.totalPages || 1;

  // Replace Zustand dialog actions with local state setters
  const openCreateDialog = () => {
    setCurrentTag(null);
    setIsCreateDialogOpen(true);
    setIsEditDialogOpen(false);
    setIsDeleteDialogOpen(false);
  };

  const openEditDialog = (tag: Tag) => {
    setCurrentTag(tag);
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(true);
    setIsDeleteDialogOpen(false);
  };

  const openDeleteDialog = (tag?: Tag) => {
    setCurrentTag(tag || null);
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
    setIsDeleteDialogOpen(true);
  };

  const closeAllDialogs = () => {
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
    setIsDeleteDialogOpen(false);
  };

  const columns = useMemo<ColumnDef<Tag>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => <Checkbox checked={table.getIsAllPageRowsSelected()} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} aria-label="Select all" />,
        cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />,
        enableSorting: false,
      },
      {
        accessorKey: "id",
        header: t("ID"),
      },
      {
        accessorKey: "name",
        header: t("Name"),
        cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
      },
    ],
    [t]
  );
  // New ends

  const form = useForm({
    resolver: zodResolver(tagFormSchema),
    defaultValues: {
      name: currentTag?.name || "",
    },
  });

  // Reset form when currentTag changes
  useEffect(() => {
    form.reset({
      name: currentTag?.name || "",
    });
  }, [currentTag, form]);

  const table = useReactTable({
    data: data?.tags || [],
    columns,
    pageCount: totalPages,
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

  const handleCreateTag = async (values: { name: string }) => {
    try {
      await createTag.mutateAsync(values);
      toast.success(t("Tag created successfully"));
      form.reset();
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast.error(t("Failed to create tag"));
    }
  };

  const handleEditClick = () => {
    const selectedTags = table.getSelectedRowModel().rows;
    if (selectedTags.length === 1) {
      openEditDialog(selectedTags[0].original);
    }
  };

  const handleUpdateTag = async (values: { name: string }) => {
    if (!currentTag) return;

    try {
      await updateTag.mutateAsync({ id: currentTag.id, values });
      toast.success(t("Tag updated successfully"));
      form.reset();
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error(t("Failed to update tag"));
    }
  };

  const handleDeleteTag = async () => {
    if (!currentTag) return;

    try {
      await deleteTag.mutateAsync(currentTag.id);
      toast.success(t("Tag deleted successfully"));
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast.error(t("Failed to delete tag"));
    }
  };

  const handleDeleteClick = () => {
    if (table.getSelectedRowModel().rows.length === 1) {
      openDeleteDialog(table.getSelectedRowModel().rows[0].original);
    } else {
      openDeleteDialog();
    }
  };

  const handleBulkDelete = async () => {
    const selectedTagIds = table.getSelectedRowModel().rows.map((row) => row.original.id);

    if (selectedTagIds.length === 0) {
      setIsDeleteDialogOpen(false);
      return;
    }

    try {
      await bulkDeleteTags.mutateAsync(selectedTagIds);
      toast.success(`${selectedTagIds.length} ${t("Tags deleted successfully")}`);
      setIsDeleteDialogOpen(false);
      setRowSelection({});
    } catch (error) {
      toast.error(t("Failed to delete some tags"));
    }
  };

  if (isLoading) return <SmallSkeleton />;

  if (isError) {
    return (
      <div className="text-red-500">
        Error loading tags: {error?.message}
        <Button variant="outline" onClick={() => window.location.reload()}>
          {t("Retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          {/* Create Tag Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={openCreateDialog}>
                <Icons.plus className="h-4 w-4 mr-2" />
                {t("Create Tag")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("Create a new tag")}</TooltipContent>
          </Tooltip>

          {/* Edit Selected Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={handleEditClick} disabled={table.getSelectedRowModel().rows.length !== 1}>
                <Icons.edit className="h-4 w-4 mr-2" />
                {t("Edit")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("Edit selected tag")}</TooltipContent>
          </Tooltip>

          {/* Delete Selected Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={handleDeleteClick} disabled={table.getSelectedRowModel().rows.length === 0}>
                {isUpdating ? <Icons.spinner className="h-4 w-4 mr-2 animate-spin" /> : <Icons.trash className="h-4 w-4 mr-2" />}
                {t("Delete")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("Delete selected tags")}</TooltipContent>
          </Tooltip>
        </div>

        <Input placeholder="Filter tags..." value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} className="max-w-sm" />
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
              {t("Previous")}
            </Button>
          </PaginationItem>
          <PaginationItem>
            <span className="text-sm">
              {t("Page")} {pagination.pageIndex + 1} {t("of")} {totalPages}
            </span>
          </PaginationItem>
          <PaginationItem>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              {t("Next")}
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      {/* Create Tag Dialog */}
      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) form.reset();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Tag</DialogTitle>
            <DialogDescription>Add a new tag to the system.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateTag)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tag Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter tag name" {...field} />
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
                  Create Tag
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Tag Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={closeAllDialogs}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
            <DialogDescription>Make changes to the tag.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateTag)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tag Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter tag name" {...field} />
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
            <DialogDescription>{currentTag ? `Are you sure you want to delete the tag "${currentTag.name}"?` : `Are you sure you want to delete ${table.getSelectedRowModel().rows.length} selected tags?`}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeAllDialogs}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (currentTag) {
                  handleDeleteTag(); // Call the delete function directly
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
